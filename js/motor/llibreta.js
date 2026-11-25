/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/motor/llibreta.js
 * ROL: Pinta un exemple a la llibreta i n'atén el ratolí, el dit i el teclat.
 *      La lògica és a js/motor/estat.js; aquí només hi ha DOM.
 * ARQUITECTURA:
 * - creaLlibreta(contenidor, ex, cfg, { onAcaba }) → { estat, destrueix }.
 *   onAcaba(punts, estat) es crida un sol cop, quan l'exemple s'acaba.
 * - Dues capes de color (R1, docs/SPEC.md §3): la llibreta (errada = vermell del
 *   professor, línia correcta = ✓ de llapis) i la resposta de l'alumne
 *   (encert lila / no encert gris, sempre amb text). La correcció del professor
 *   va amb una altra lletra (R2, Permanent Marker).
 * - Totes les línies alineades pel «=» (R4): cada línia és una graella
 *   «membre esquerre | = | membre dret».
 * - Teclat (G6): ↑/↓ i 1–9 trien la línia, Enter = «Comprova», Esc = desfés.
 * - Fórmules: el format de text del generador ({a|b} = fracció; $…$ als textos).
 *   Tot el que s'escriu passa per esc(): el contingut és nostre, però així no
 *   hi ha cap camí per injectar marques.
 * DEPENDÈNCIES: js/motor/estat.js.
 * ============================================================================
 */
import { nouEstat, selecciona, comprova, triaPerque, triaCorreccio, capMes, errades, punts, seleccionable } from './estat.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
/** Una expressió: fraccions {a|b} apilades i la x en cursiva. */
export const fm = s =>
    esc(s)
        .replace(/\{([^|{}]+)\|([^|{}]+)\}/g, '<span class="fr"><span>$1</span><span>$2</span></span>')
        .replace(/x/g, '<i>x</i>');
/** Un text amb fórmules entre $…$. */
export const txt = s =>
    String(s)
        .split('$')
        .map((p, k) => (k % 2 ? `<span class="fx">${fm(p)}</span>` : esc(p)))
        .join('');
const maj = s => s.charAt(0).toUpperCase() + s.slice(1);

export function creaLlibreta(contenidor, ex, cfg, { onAcaba } = {}) {
    const S = nouEstat();
    let acabat = false;
    const n = errades(ex).length;

    function consigna() {
        let t = `${maj(ex.alumne)} ha resolt aquesta equació`;
        if (n === 0 || !cfg.anuncia) t += ". Si hi ha alguna línia que no es pot deduir de l'anterior, toca-la; si no n'hi ha cap, digues-ho.";
        else if (n === 1) t += " i ha comès una errada. Toca la primera línia que no es pot deduir de l'anterior.";
        else t += ' i ha comès dues errades. Toca les dues línies que no es poden deduir de la línia anterior.';
        return t;
    }

    function expr(i) {
        const L = ex.linies[i],
            q = L.indexOf('='),
            e = ex.errades[i],
            trobada = S.trobades.includes(i);
        const terme = (t, j) => `<span class="t${trobada && e && e.terme === j ? ' mal' : ''}">${fm(t)}</span>`;
        const a = L.slice(0, q).map((t, j) => terme(t, j)).join(''),
            b = L.slice(q + 1).map((t, j) => terme(t, j + q + 1)).join('');
        return `<span class="ex"><span class="ma">${a}</span><span class="t">=</span><span class="mb">${b}</span></span>`;
    }

    /** La línia bona, amb la lletra del professor i el «=» a la mateixa vertical que els altres (R4). */
    function correccio(bona) {
        const k = bona.indexOf(' = ');
        return `<span class="corr ex" aria-label="Havia de ser: ${esc(bona)}"><span class="ma">${fm(bona.slice(0, k))}</span><span class="t">=</span><span class="mb">${fm(bona.slice(k + 3))}</span></span>`;
    }

    /** Des de quina línia les següents arrosseguen una errada ja corregida (null si encara no toca). */
    function inicArrossega() {
        const corregides = S.trobades.filter(k => S.corregides[k]);
        if (!corregides.length || errades(ex).some(k => !S.trobades.includes(k))) return null;
        const j = Math.min(...corregides);
        return j < ex.linies.length - 1 ? j + 1 : null;
    }

    function liniaHTML(i) {
        const trobada = S.trobades.includes(i),
            revisada = S.revisades.includes(i);
        let cls = 'ln';
        if (trobada) cls += ' err';
        if (S.sel === i) cls += ' sel';
        if (trobada && S.corregides[i]) cls += ' tat';
        let marques = '';
        if (i === 0) marques += '<span class="tag">enunciat</span>';
        if (trobada) marques += `<span class="mk e" title="Línia amb errada">✗${S.ajuda.includes(i) ? ' <small>amb ajuda</small>' : ''}</span>`;
        else if (revisada) marques += '<span class="mk c" title="Línia correcta">✓</span>';
        const corr = trobada && S.corregides[i] ? correccio(ex.errades[i].bona) : '';
        const dins = `<span class="n">${i + 1}</span>${expr(i)}<span class="tags">${marques}</span>${corr}`;
        if (seleccionable(S, ex, i))
            return `<button type="button" class="${cls}" data-l="${i}" aria-pressed="${S.sel === i}" aria-label="Línia ${i + 1}">${dins}</button>`;
        return `<div class="${cls}">${dins}</div>`;
    }

    function pinta() {
        const teniaFocus = contenidor.contains(document.activeElement) || document.activeElement === contenidor;
        let h = `<div class="cap-ex"><p class="ins">${esc(consigna())}</p><div class="chips">`;
        if (cfg.anuncia && n > 0) h += `<span class="chip">Errades trobades: ${S.trobades.length} de ${n}</span>`;
        h += `<span class="chip">Punts: ${punts(S)}</span></div></div><div class="linies">`;
        const arr = inicArrossega();
        for (let i = 0; i < ex.linies.length; i++) {
            if (i === arr) h += '<div class="arrossega">';
            h += liniaHTML(i);
        }
        if (arr !== null)
            h += `<span class="parent" aria-hidden="true"></span><span class="nota-arr">Ve d'una errada:<br>no té sentit</span></div>`;
        h += '</div>';
        // El missatge, abans de la pregunta de la fase: així «Sí! L'errada és aquí.» i la pregunta es veuen junts
        const m = S.msg;
        h += `<div class="msg${m ? ' ' + m.tipus : ''}" role="status" aria-live="polite">${m ? txt(m.text) : ''}</div>`;
        if (S.fase === 'perque') {
            const e = ex.errades[S.actual];
            h += `<div class="fase"><h3>Per què és una errada?</h3><div class="opc">${e.perque
                .map(([t], j) => `<button type="button" class="b" data-pq="${j}">${txt(t)}</button>`)
                .join('')}</div></div>`;
        }
        if (S.fase === 'corregeix') {
            const e = ex.errades[S.actual];
            h += `<div class="fase"><h3>Com hauria de quedar la línia ${S.actual + 1}?</h3><div class="opc">${e.opcions
                .map(([t], j) => `<button type="button" class="b mat" data-co="${j}">${fm(t)}</button>`)
                .join('')}</div></div>`;
        }
        if (!S.fi && S.fase === 'busca') {
            let a = `<button type="button" class="b pri" data-a="comprova"${S.sel === null ? ' disabled' : ''}>Comprova</button>`;
            if (n === 0 || !cfg.anuncia)
                a += `<button type="button" class="b" data-a="cap">${S.trobades.length ? "No n'hi ha cap més" : 'No hi ha cap errada'}</button>`;
            h += `<div class="acc">${a}</div>`;
        }
        if (S.fi && ex.nota) h += `<div class="msg info">${txt(ex.nota)}</div>`;
        contenidor.innerHTML = h;
        if (teniaFocus && !S.fi) {
            const b = contenidor.querySelector('.fase .b');
            (b || contenidor).focus({ preventScroll: true });
        }
        // Amb una fase oberta, el missatge i la pregunta han de quedar a la vista
        const fase = contenidor.querySelector('.fase');
        if (fase) {
            const msg = contenidor.querySelector('.msg'),
                a = msg.getBoundingClientRect(),
                b = fase.getBoundingClientRect();
            if (a.top < 0 || b.bottom > innerHeight) msg.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }
        if (S.fi && !acabat) {
            acabat = true;
            if (typeof onAcaba === 'function') onAcaba(punts(S), S);
        }
    }

    function clic(ev) {
        const b = ev.target.closest('button');
        if (!b || !contenidor.contains(b)) return;
        const d = b.dataset;
        if (d.l !== undefined) selecciona(S, ex, +d.l);
        else if (d.pq !== undefined) triaPerque(S, ex, cfg, +d.pq);
        else if (d.co !== undefined) triaCorreccio(S, ex, cfg, +d.co);
        else if (d.a === 'comprova') comprova(S, ex, cfg);
        else if (d.a === 'cap') capMes(S, ex, cfg);
        else return;
        pinta();
    }

    function tecla(ev) {
        if (S.fi || S.fase !== 'busca') return;
        const k = ev.key,
            ult = ex.linies.length - 1;
        const busca = (des, pas) => {
            for (let i = des; i >= 0 && i <= ult; i += pas) if (seleccionable(S, ex, i)) return i;
            return S.sel;
        };
        let s = S.sel;
        if (/^[1-9]$/.test(k)) s = +k - 1 <= ult ? +k - 1 : S.sel;
        else if (k === 'ArrowDown') s = busca(s === null ? 0 : s + 1, 1);
        else if (k === 'ArrowUp') s = busca(s === null ? ult : s - 1, -1);
        else if (k === 'Escape') {
            S.sel = null;
            S.msg = null;
            pinta();
            contenidor.focus();
            return;
        } else if (k === 'Enter') {
            if (S.sel !== null && (ev.target === contenidor || ev.target === document.body)) {
                ev.preventDefault();
                comprova(S, ex, cfg);
                pinta(); // si s'obre una fase, el focus ja és al seu primer botó
                if (!contenidor.querySelector('.fase .b') && !S.fi) contenidor.focus();
            }
            return;
        } else return;
        ev.preventDefault();
        if (seleccionable(S, ex, s)) S.sel = s;
        pinta();
        contenidor.focus();
    }

    // Si el focus no és enlloc (en obrir la pàgina), el teclat també mana sobre la llibreta
    const teclaDocument = ev => {
        if (document.activeElement === document.body || document.activeElement === null) tecla(ev);
    };
    contenidor.addEventListener('click', clic);
    contenidor.addEventListener('keydown', tecla);
    document.addEventListener('keydown', teclaDocument);
    pinta();
    return {
        estat: S,
        destrueix() {
            contenidor.removeEventListener('click', clic);
            contenidor.removeEventListener('keydown', tecla);
            document.removeEventListener('keydown', teclaDocument);
        },
    };
}
