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
 *   «membre esquerre | = | membre dret», i alinea() dona a totes les línies
 *   l'ample del membre més llarg (--ma, --mb): el «=» no es mou ni quan una
 *   línia no hi cap.
 * - Teclat (G6): ↑/↓ i 1–9 trien la línia, Enter = «Comprova», Esc = desfés.
 * - Encerclar amb el dit (R3, cfg.encercla): sobre les línies, un traç marca una
 *   línia (i 1–2 termes); la geometria és a js/motor/llac.js. Un toc curt continua
 *   sent un toc. Mentre es busca, la llibreta no desplaça la pàgina amb el dit.
 * - Dues activitats (cfg.activitat): 'equacions' (cada línia «A = B») i 'prioritat'
 *   (l'enunciat sense «=» i cada línia «= expressió»): parts() separa els membres.
 * - Fórmules: el format de text del generador ({a|b} = fracció; $…$ als textos).
 *   Tot el que s'escriu passa per esc(): el contingut és nostre, però així no
 *   hi ha cap cami per injectar marques.
 * DEPENDÈNCIES: js/motor/estat.js.
 * ============================================================================
 */
import { nouEstat, selecciona, marcaLlac, llacDubtos, comprova, triaTerme, triaPerque, triaCorreccio, escriuAra, escriuCorreccio, capMes, errades, punts, seleccionable, arrossega } from './estat.js';
import { avalua, llargada } from './llac.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
/** Una expressió: fraccions {a|b} apilades, la x en cursiva i les potències (3^2) amb l'exponent a dalt. */
export const fm = s =>
    esc(s)
        .replace(/\{([^|{}]+)\|([^|{}]+)\}/g, '<span class="fr"><span>$1</span><span>$2</span></span>')
        .replace(/x/g, '<i>x</i>')
        .replace(/\^(\d+)/g, '<sup>$1</sup>');
/** Els membres d'una línia de fitxes: [esquerre, hi ha «=», dret]. Sense «=» (l'enunciat de prioritat), tot és el dret. */
export const parts = L => {
    const q = L.indexOf('=');
    return q < 0 ? [[], false, L, 0] : [L.slice(0, q), true, L.slice(q + 1), q + 1];
};
/** El mateix per a una línia en text: «2x + 4 = 13», «= 3 + 8» o «3 + 4 · 2». */
const partsTxt = s => {
    if (s.startsWith('= ')) return ['', true, s.slice(2)];
    const k = s.indexOf(' = ');
    return k < 0 ? ['', false, s] : [s.slice(0, k), true, s.slice(k + 3)];
};
const TEXTOS = {
    equacions: { fet: 'ha resolt aquesta equació', on: "que no es pot deduir de l'anterior", ons: 'que no es poden deduir de la línia anterior', teclat: ['7', '8', '9', '⌫', '4', '5', '6', 'x', '1', '2', '3', '/', '+', '0', '−'], exemple: '+8' },
    prioritat: { fet: 'ha calculat aquesta expressió', on: "on s'ha equivocat", ons: "on s'ha equivocat", teclat: ['7', '8', '9', '⌫', '4', '5', '6', '−', '1', '2', '3', '0'], exemple: '12' },
};
/** Un text amb fórmules entre $…$. */
export const txt = s =>
    String(s)
        .split('$')
        .map((p, k) => (k % 2 ? `<span class="fx">${fm(p)}</span>` : esc(p).replace(/\n/g, '<br>')))
        .join('');
const maj = s => s.charAt(0).toUpperCase() + s.slice(1);

export function creaLlibreta(contenidor, ex, cfg, { onAcaba } = {}) {
    const S = nouEstat();
    let acabat = false,
        tsel = null, // terme amb el focus del teclat a la fase del terme
        valorEscrit = ''; // el que l'alumne porta escrit a «Corregeix-la» (es conserva en tornar a pintar)
    const n = errades(ex).length;
    const T = TEXTOS[cfg.activitat] || TEXTOS.equacions;
    let ignoraClic = false; // després d'un traç, el clic que el navegador hi afegeix no compta

    /**
     * Totes les línies (i les correccions) amb el mateix ample de membre esquerre i de membre dret:
     * així el «=» queda a la mateixa vertical encara que un membre no hi càpiga (pantalles estretes).
     */
    function alinea() {
        const lin = contenidor.querySelector('.linies');
        if (!lin) return;
        lin.style.removeProperty('--ma');
        lin.style.removeProperty('--mb');
        let a = 0,
            b = 0;
        lin.querySelectorAll('.ex > .ma').forEach(e => (a = Math.max(a, e.getBoundingClientRect().width)));
        lin.querySelectorAll('.ex > .mb').forEach(e => (b = Math.max(b, e.getBoundingClientRect().width)));
        lin.style.setProperty('--ma', Math.ceil(a) + 'px');
        lin.style.setProperty('--mb', Math.ceil(b) + 'px');
    }

    /** La consigna en dues files: què ha fet l'alumne fictici i, a sota, què ha de fer l'alumne (el David, 25/11/2026). */
    function consigna() {
        const qui = `${maj(ex.alumne)} ${T.fet}`;
        const v = cfg.encercla ? 'encercla' : 'toca';
        if (n === 0 || !cfg.anuncia) return [qui + '.', `Si hi ha alguna línia ${T.on}, ${v}-la; si no n'hi ha cap, digues-ho.`];
        if (n === 1) return [qui + ' i ha comès una errada.', `${maj(v)} la primera línia ${T.on}.`];
        return [qui + ' i ha comès dues errades.', `${maj(v)} les dues línies ${T.ons}.`];
    }

    function expr(i) {
        const L = ex.linies[i],
            [esq, igual, dre, des] = parts(L),
            e = ex.errades[i],
            trobada = S.trobades.includes(i);
        // A la fase del terme, els termes de la línia són botons al mateix lloc (sense ampliar-la, R4)
        const tria = S.fase === 'terme' && S.actual === i;
        const cercle = trobada && e && (!cfg.terme || S.termes[i] || S.ajuda.includes(i));
        const terme = (t, j) =>
            tria
                ? `<button type="button" class="tb${tsel === j ? ' sel' : ''}" data-tm="${j}" aria-label="Terme ${esc(t)}">${fm(t)}</button>`
                : `<span class="t${cercle && (e.termes || [e.terme]).includes(j) ? ' mal' : ''}" data-j="${j}">${fm(t)}</span>`;
        const a = esq.map((t, j) => terme(t, j)).join(''),
            b = dre.map((t, j) => terme(t, j + des)).join('');
        // Corregida: només es ratlla el membre que no coincideix amb el de la línia bona (el David, 25/11/2026)
        let ra = '',
            rb = '';
        if (trobada && S.corregides[i]) {
            const [ba, , bb] = partsTxt(e.bona);
            if (esq.join(' ') !== ba) ra = ' ratlla';
            if (dre.join(' ') !== bb) rb = ' ratlla';
        }
        return `<span class="ex"><span class="ma${ra}">${a}</span><span class="t">${igual ? '=' : ''}</span><span class="mb${rb}">${b}</span></span>`;
    }

    /** La línia bona, amb la lletra del professor i el «=» a la mateixa vertical que els altres (R4). */
    function correccio(bona) {
        const [ba, igual, bb] = partsTxt(bona);
        return `<span class="corr ex" aria-label="Havia de ser: ${esc(bona)}"><span class="ma">${fm(ba)}</span><span class="t">${igual ? '=' : ''}</span><span class="mb">${fm(bb)}</span></span>`;
    }

    /** Des de quina línia les següents arrosseguen una errada ja corregida (null si encara no toca). */
    function inicArrossega() {
        const corregides = S.trobades.filter(k => S.corregides[k]);
        if (!corregides.length || errades(ex).some(k => !S.trobades.includes(k))) return null;
        const j = Math.min(...corregides);
        return j < ex.linies.length - 1 ? j + 1 : null;
    }

    /** En una fase («Per què?», «Corregeix-la») només compten la línia equivocada i l'anterior. */
    const enJoc = i => S.actual !== null && (i === S.actual || i === S.actual - 1);

    function liniaHTML(i) {
        const trobada = S.trobades.includes(i),
            revisada = S.revisades.includes(i);
        // Les línies es numeren 0, 1, 2…: la 0 és l'enunciat. El número encerclat vol dir «encara pot ser aquí»
        // En acabar, ✓ a totes les línies bones d'abans de la primera errada (el David, 25/11/2026)
        const primera = errades(ex)[0];
        const bonaFinal = S.fi && i > 0 && !trobada && (primera === undefined || i < primera);
        const candidata = i > 0 && !trobada && !revisada && !S.fi;
        let cls = 'ln' + (i === 0 ? ' enunciat' : '') + (candidata ? '' : ' fora');
        if (trobada) cls += ' err';
        if (S.sel === i) cls += ' sel';
        if (trobada && S.corregides[i]) cls += ' tat';
        if (S.fase === 'terme' && i === S.actual - 1) cls += ' ref';
        let marques = '';
        if (trobada) marques += `<span class="mk e" title="Línia amb errada">✗${S.ajuda.includes(i) ? ' <small>amb ajuda</small>' : ''}</span>`;
        else if (revisada || bonaFinal) marques += '<span class="mk c" title="Línia correcta">✓</span>';
        const corr = trobada && S.corregides[i] ? correccio(ex.errades[i].bona) : '';
        const dins = `<span class="n">${i}</span>${expr(i)}<span class="tags">${marques}</span>${corr}`;
        const ln = seleccionable(S, ex, i)
            ? `<button type="button" class="${cls}" data-l="${i}" aria-pressed="${S.sel === i}" aria-label="Línia ${i}">${dins}</button>`
            : `<div class="${cls}"${i === 0 ? ' title="És l\'enunciat: aquí no hi pot haver cap errada"' : ''}>${dins}</div>`;
        // «Comprova» només surt quan hi ha una línia triada, just a la seva esquerra (el David, 25/11/2026)
        const cv = S.sel === i && S.fase === 'busca' && !S.fi ? '<button type="button" class="b pri" data-a="comprova">Comprova</button>' : '';
        const atenua = S.fase !== 'busca' && S.fase !== 'fi' && !enJoc(i);
        return `<div class="fila${atenua ? ' atenua' : ''}${cv ? ' amb-cv' : ''}${trobada ? ' trobada' : ''}" data-i="${i}"><div class="cv">${cv}</div>${ln}</div>`;
    }

    const msgHTML = () => `<div class="msg ${S.msg.tipus}" role="status" aria-live="polite">${txt(S.msg.text)}</div>`;

    function faseHTML() {
        const e = ex.errades[S.actual];
        // errades compensades: la línia s'ha de comparar amb la de sobre tal com està escrita (el David, 26/11/2026)
        const k = arrossega(ex, S.actual),
            avis = k === null ? '' : `<p class="pista">Compara-la amb la línia ${S.actual - 1} tal com està escrita, encara que arrossegui l'errada de la línia ${k}.</p>`;
        if (S.fase === 'terme')
            return `<div class="fase"><h3>Quin terme està malament?</h3><p class="pista">Toca'l a la línia ${S.actual}.</p>${avis}</div>`;
        if (S.fase === 'perque')
            return `<div class="fase"><h3>Per què és una errada?</h3>${avis}<div class="opc">${e.perque
                .map(([t], j) => `<button type="button" class="b" data-pq="${j}">${txt(t)}</button>`)
                .join('')}</div></div>`;
        if (escriuAra(S, ex, cfg))
            return `<div class="fase escriu"><h3>Com havia de ser el terme encerclat?</h3>${avis}
<form class="escriu-fila" data-escriu><label class="vh" for="escrit">El terme ben fet</label>
<input id="escrit" class="escrit" type="text" autocomplete="off" spellcheck="false" inputmode="${matchMedia('(pointer: coarse)').matches ? 'none' : 'text'}" placeholder="p. ex. ${T.exemple}">
<button type="submit" class="b pri">Comprova</button></form>
<div class="teclat${T.teclat.length === 12 ? ' t12' : ''}" aria-label="Teclat">${T.teclat
                .map(k => `<button type="button" class="b tk" data-k="${k}">${k}</button>`)
                .join('')}</div></div>`;
        if (S.fase === 'corregeix')
            return `<div class="fase"><h3>Com hauria de quedar la línia ${S.actual}?</h3>${avis}<div class="opc">${e.opcions
                .map(([t], j) => `<button type="button" class="b mat" data-co="${j}">${fm(t)}</button>`)
                .join('')}</div></div>`;
        return '';
    }

    /** Desplaça la finestra el mínim perquè es vegi el bloc [des, fins]; si no hi cap, n'ensenya el començament. */
    function fesVisible(des, fins) {
        if (!des || !fins) return;
        const marge = 12,
            a = des.getBoundingClientRect().top - marge,
            b = fins.getBoundingClientRect().bottom + marge,
            alt = innerHeight;
        let dy = 0;
        if (b - a > alt || a < 0) dy = a;
        else if (b > alt) dy = b - alt;
        if (dy) scrollBy({ top: dy, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }

    function pinta() {
        const teniaFocus = contenidor.contains(document.activeElement) || document.activeElement === contenidor;
        const [f1, f2] = consigna();
        let h = `<div class="cap-ex"><div class="fila-ins"><p class="ins">${esc(f1)}</p><div class="chips">`;
        if (cfg.anuncia) h += `<span class="chip">Errades: ${n}</span>`;
        h += `<span class="chip">Localitzades: ${S.trobades.length}</span></div></div><p class="ins">${esc(f2)}</p></div><div class="linies${llacActiu() ? ' llac' : ''}">`;
        const arr = inicArrossega();
        let msgPosat = false;
        for (let i = 0; i < ex.linies.length; i++) {
            if (i === arr) h += '<div class="arrossega">';
            h += liniaHTML(i);
            // El missatge i la fase, just a sota de la línia de què parlen: així la línia anterior, la línia,
            // el missatge i les opcions queden junts i caben a la pantalla
            if (S.msg && S.msgLinia === i) {
                h += `<div class="sota">${msgHTML()}${S.actual === i ? faseHTML() : ''}</div>`;
                msgPosat = true;
            }
        }
        if (arr !== null) h += '<span class="parent esq" aria-hidden="true"></span><span class="parent dre" aria-hidden="true"></span></div>';
        if (cfg.encercla) h += `<svg class="traca" aria-hidden="true"><path d="${S.traca ? cami(S.traca) : ''}"/></svg>`;
        h += '</div>';
        if (S.msg && !msgPosat) h += `<div class="sota sense-linia">${msgHTML()}</div>`;
        if (!S.fi && S.fase === 'busca' && (n === 0 || !cfg.anuncia))
            h += `<div class="acc"><button type="button" class="b" data-a="cap">${S.trobades.length ? "No n'hi ha cap més" : 'No hi ha cap errada'}</button></div>`;
        if (S.fi && ex.nota) h += `<div class="msg info">${txt(ex.nota)}</div>`;
        contenidor.innerHTML = h;
        alinea();
        const escrit = contenidor.querySelector('#escrit');
        if (escrit) {
            escrit.value = valorEscrit;
            if (!matchMedia('(pointer: coarse)').matches) escrit.focus({ preventScroll: true });
        } else if (teniaFocus && !S.fi) {
            const b = contenidor.querySelector('.fase .b');
            (b || contenidor).focus({ preventScroll: true });
        }
        // Amb una fase oberta, s'han de veure la línia anterior, la línia equivocada, el missatge i totes les opcions
        const fase = contenidor.querySelector('.fase');
        if (fase) fesVisible(contenidor.querySelector(`.fila[data-i="${Math.max(0, S.actual - 1)}"]`), fase);
        else if (S.msg && S.msgLinia !== null && !S.fi)
            fesVisible(contenidor.querySelector(`.fila[data-i="${S.msgLinia}"]`), contenidor.querySelector('.sota'));
        if (S.fi && !acabat) {
            acabat = true;
            if (typeof onAcaba === 'function') onAcaba(punts(S), S);
        }
    }

    // ---------- Encerclar amb el dit (R3) ----------
    const llacActiu = () => !!cfg.encercla && !S.fi && S.fase === 'busca';
    const cami = pts => 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
    let dib = null; // { lin, r, id, pts, actiu }
    function llacInici(ev) {
        if (!llacActiu() || ev.button > 0) return;
        const lin = ev.target.closest('.linies');
        if (!lin || !contenidor.contains(lin) || ev.target.closest('[data-a]')) return;
        const r = lin.getBoundingClientRect();
        dib = { lin, r, id: ev.pointerId, pts: [[ev.clientX - r.left, ev.clientY - r.top]], actiu: false };
    }
    function llacMou(ev) {
        if (!dib || ev.pointerId !== dib.id) return;
        const p = [ev.clientX - dib.r.left, ev.clientY - dib.r.top],
            ult = dib.pts[dib.pts.length - 1];
        if (Math.hypot(p[0] - ult[0], p[1] - ult[1]) < 2) return;
        dib.pts.push(p);
        // fins que el traç no fa 8 px, encara pot ser un toc
        if (!dib.actiu && llargada(dib.pts) >= 8) {
            dib.actiu = true;
            try {
                dib.lin.setPointerCapture(ev.pointerId);
            } catch (e) {
                /* sense captura també funciona */
            }
        }
        if (dib.actiu) {
            ev.preventDefault();
            const path = dib.lin.querySelector('svg.traca path');
            if (path) path.setAttribute('d', cami(dib.pts));
        }
    }
    function llacFi(ev) {
        if (!dib || ev.pointerId !== dib.id) return;
        const d = dib;
        dib = null;
        if (!d.actiu) return; // un toc: el clic normal tria la línia
        ignoraClic = true;
        setTimeout(() => (ignoraClic = false), 0);
        // les caixes de les línies i dels termes, en les coordenades del traç
        const rel = el => {
            const r = el.getBoundingClientRect();
            return { l: r.left - d.r.left, t: r.top - d.r.top, r: r.right - d.r.left, b: r.bottom - d.r.top };
        };
        const linies = [...d.lin.querySelectorAll('.fila')].map(f => {
            const ln = f.querySelector('.ln'),
                rl = rel(ln),
                ex1 = ln.querySelector(':scope > .ex');
            const termes = ex1
                ? [...ex1.querySelectorAll(':scope > .ma > .t, :scope > .mb > .t')].map(t => {
                      const r = rel(t);
                      return { j: +t.dataset.j, cx: (r.l + r.r) / 2, cy: (r.t + r.b) / 2 };
                  })
                : [];
            return { i: +f.dataset.i, t: rl.t, b: rl.b, termes };
        });
        const res = avalua(d.pts, linies);
        if (res.torna) llacDubtos(S, res.torna);
        else if (res.linia === 0) llacDubtos(S, "és l'enunciat: aquí no hi pot haver cap errada.");
        else if (!seleccionable(S, ex, res.linia)) llacDubtos(S, 'aquesta línia ja està revisada.');
        else marcaLlac(S, ex, res.linia, res.termes, d.pts);
        pinta();
    }
    function llacCancel(ev) {
        if (dib && ev.pointerId === dib.id) {
            dib = null;
            pinta();
        }
    }

    function clic(ev) {
        if (ignoraClic) return;
        const b = ev.target.closest('button');
        if (!b || !contenidor.contains(b)) return;
        const d = b.dataset;
        if (d.k !== undefined) {
            const inp = contenidor.querySelector('#escrit');
            if (!inp) return;
            inp.value = d.k === '⌫' ? inp.value.slice(0, -1) : inp.value + d.k;
            valorEscrit = inp.value;
            return;
        }
        if (d.tm !== undefined) {
            tsel = null;
            triaTerme(S, ex, cfg, +d.tm);
        } else if (d.l !== undefined) selecciona(S, ex, +d.l);
        else if (d.pq !== undefined) triaPerque(S, ex, cfg, +d.pq);
        else if (d.co !== undefined) triaCorreccio(S, ex, cfg, +d.co);
        else if (d.a === 'comprova') comprova(S, ex, cfg);
        else if (d.a === 'cap') capMes(S, ex, cfg);
        else return;
        pinta();
    }

    /** Fase del terme amb el teclat: ←/→ recorren els termes de la línia, Enter tria. */
    function teclaTerme(ev) {
        const L = ex.linies[S.actual],
            ids = L.map((t, j) => (t === '=' ? -1 : j)).filter(j => j >= 0);
        if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
            ev.preventDefault();
            let p = ids.indexOf(tsel);
            p = p < 0 ? (ev.key === 'ArrowRight' ? 0 : ids.length - 1) : (p + (ev.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length;
            tsel = ids[p];
            pinta();
            const b = contenidor.querySelector(`[data-tm="${tsel}"]`);
            if (b) b.focus({ preventScroll: true });
        }
    }

    function tecla(ev) {
        if (!S.fi && S.fase === 'terme') return teclaTerme(ev);
        if (S.fi || S.fase !== 'busca') return;
        const k = ev.key,
            ult = ex.linies.length - 1;
        const busca = (des, pas) => {
            for (let i = des; i >= 0 && i <= ult; i += pas) if (seleccionable(S, ex, i)) return i;
            return S.sel;
        };
        let s = S.sel;
        if (/^[0-9]$/.test(k)) s = seleccionable(S, ex, +k) ? +k : S.sel;
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
    function envia(ev) {
        if (!ev.target.matches('[data-escriu]')) return;
        ev.preventDefault();
        const inp = contenidor.querySelector('#escrit');
        valorEscrit = '';
        escriuCorreccio(S, ex, cfg, inp ? inp.value : '');
        pinta();
    }
    const escriuInput = ev => {
        if (ev.target.id === 'escrit') valorEscrit = ev.target.value;
    };
    contenidor.addEventListener('submit', envia);
    contenidor.addEventListener('input', escriuInput);
    contenidor.addEventListener('click', clic);
    contenidor.addEventListener('keydown', tecla);
    document.addEventListener('keydown', teclaDocument);
    contenidor.addEventListener('pointerdown', llacInici);
    contenidor.addEventListener('pointermove', llacMou);
    contenidor.addEventListener('pointerup', llacFi);
    contenidor.addEventListener('pointercancel', llacCancel);
    // la mida de la lletra canvia amb l'amplada (560px) i quan s'acaben de carregar les lletres
    addEventListener('resize', alinea);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(alinea);
    pinta();
    return {
        estat: S,
        destrueix() {
            contenidor.removeEventListener('click', clic);
            contenidor.removeEventListener('submit', envia);
            contenidor.removeEventListener('input', escriuInput);
            contenidor.removeEventListener('keydown', tecla);
            document.removeEventListener('keydown', teclaDocument);
            contenidor.removeEventListener('pointerdown', llacInici);
            contenidor.removeEventListener('pointermove', llacMou);
            contenidor.removeEventListener('pointerup', llacFi);
            contenidor.removeEventListener('pointercancel', llacCancel);
            removeEventListener('resize', alinea);
        },
    };
}
