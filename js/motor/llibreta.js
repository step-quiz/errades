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
 *   sent un toc. Mentre es busca, el dit no desplaça la pàgina sobre les línies; la
 *   columna de l'esquerra (trama de punts) sí que la desplaça (auditoria T3).
 * - Res no es mou sol (auditoria del 28/11/2026): els missatges de la fase de buscar
 *   van a la columna de l'esquerra (pantalles ≥ 1000 px) o a una barra fixa a baix
 *   (més estretes; al mòbil també «Comprova»), per sobre del contingut (T5).
 *   Tornar a tocar la línia triada = «Comprova» (C10). Després de pintar, 300 ms
 *   sense tocs (T2). El «hover», només amb el ratolí (html.tacte, T1).
 * - Feedback (auditoria, etapa 2): xip d'intents, passos de cada errada i consigna
 *   de la fase d'ara (sense canviar l'alçada), un sol bloc sota la línia amb les
 *   respostes ja contestades a la vista, rètols i la demostració del traç (un cop
 *   per navegador). Els textos nous, a TEXTOS_ETAPA2.
 * - Dues activitats (cfg.activitat): 'equacions' (cada línia «A = B») i 'prioritat'
 *   (l'enunciat sense «=» i cada línia «= expressió»): parts() separa els membres.
 * - Lector de pantalla (auditoria E3, 28/11/2026): cada línia i cada terme porten un nom llegible
 *   (llegible(): «35 partit per x igual a 5») i els missatges s'anuncien des d'una sola regió aria-live
 *   (#anunci-llibreta), fora de la llibreta.
 * - Fórmules: el format de text del generador ({a|b} = fracció; $…$ als textos;
 *   **…** = negreta a les frases de «Per què?»).
 *   Tot el que s'escriu passa per esc(): el contingut és nostre, però així no
 *   hi ha cap cami per injectar marques.
 * DEPENDÈNCIES: js/motor/estat.js.
 * ============================================================================
 */
import { nouEstat, selecciona, marcaLlac, llacDubtos, comprova, triaTerme, triaPerque, triaCorreccio, escriuAra, escriuCorreccio, capMes, errades, punts, seleccionable, arrossega, intentsQueden } from './estat.js';
import { avalua, llargada } from './llac.js';
import { esc, esTactil, puntPrincipalTactil } from './util.js';

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
    equacions: {
        fet: 'ha resolt aquesta equació',
        on: "que no es pot deduir de l'anterior",
        ons: 'que, cadascuna, no es pot deduir de la línia anterior',
        teclat: ['7', '8', '9', '⌫', '4', '5', '6', 'x', '1', '2', '3', '/', '+', '0', '−'],
        exemple: '+8',
    },
    prioritat: { fet: 'ha calculat aquesta expressió', on: "on s'ha equivocat", ons: "on s'ha equivocat", teclat: ['7', '8', '9', '⌫', '4', '5', '6', '−', '1', '2', '3', '0'], exemple: '12' },
};
/**
 * Els textos fixos de l'auditoria del 28/11/2026, etapa 2 (aprovats pel David, artifact «Auditoria UI/UX»,
 * categoria X; X2 amb els seus canvis): els passos (C1), la consigna de cada fase (C1), les etiquetes de les respostes
 * (C6), la demostració del traç (C8) i els rètols (C9).
 */
export const TEXTOS_ETAPA2 = {
    passos: ['Línia', 'Terme', 'Per què', 'Corregeix'],
    terme: n => `Toca el terme equivocat de la línia ${n}.`,
    perque: 'Tria per què és una errada.',
    corregeix: n => `Tria com ha de quedar la línia ${n}.`,
    escriu: 'Escriu com ha de ser el terme encerclat.',
    laTeva: 'la teva',
    laCorrecta: 'la correcta',
    laTevaCorrecta: 'la teva: és la correcta',
    trobades: (k, n) => `Trobades: ${k}${n === null ? '' : ` de ${n}`}`,
    intents: 'Intents',
    intentsAria: (q, m) => `Et queden ${q} intents de ${m}`,
    demo: "Així s'encercla: fes una volta amb el dit al voltant de la línia.",
    compara: 'Compara-la amb aquesta',
    arrossega: "Aquestes línies arrosseguen l'errada",
};
const DEMO_CLAU = 'errades-demo-encercla'; // localStorage: la demostració del traç ja s'ha vist en aquest navegador (C8)
let demoFeta = false; // i, en tot cas, només un cop per pàgina
/** Un text amb fórmules entre $…$ i **negreta** (les frases de «Per què?»). */
export const txt = s =>
    String(s)
        .split('$')
        .map((p, k) => (k % 2 ? `<span class="fx">${fm(p)}</span>` : esc(p).replace(/\n/g, '<br>')))
        .join('')
        .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const maj = s => s.charAt(0).toUpperCase() + s.slice(1);
/**
 * Una expressió per al lector de pantalla (auditoria E3, 28/11/2026): «{35|x} = 5» → «35 partit per x igual a 5».
 * Accepta una línia de fitxes o un text de fórmula.
 */
export const llegible = s =>
    String(Array.isArray(s) ? s.join(' ') : s)
        .replace(/\*\*/g, '')
        .replace(/\$/g, '')
        .replace(/\{([^|{}]+)\|([^|{}]+)\}/g, '$1 partit per $2')
        .replace(/\^(\d+)/g, ' elevat a $1')
        .replace(/·/g, ' per ')
        .replace(/ : /g, ' entre ')
        .replace(/=/g, ' igual a ')
        .replace(/\+/g, ' més ')
        .replace(/−|-(?=[\dx(])/g, ' menys ')
        .replace(/\s+/g, ' ')
        .trim();
/** Un missatge en text pla per a la regió aria-live: les fórmules ($…$) es llegeixen amb llegible(). */
export const textPla = s =>
    String(s)
        .replace(/\*\*/g, '')
        .split('$')
        .map((p, k) => (k % 2 ? llegible(p) : p))
        .join('')
        .replace(/\s+/g, ' ')
        .trim();

// El «hover» només amb el ratolí (auditoria T1): amb el dit o el llapis, el navegador deixa el gris i la vora negra
// enganxats al lloc tocat, i el botó nou que hi surt semblaria triat. html.tacte = l'últim punter no és un ratolí.
if (typeof document !== 'undefined' && typeof addEventListener === 'function') {
    const arrel = document.documentElement;
    addEventListener('pointerdown', e => arrel.classList.toggle('tacte', e.pointerType !== 'mouse'), true);
    addEventListener('pointermove', e => e.pointerType === 'mouse' && arrel.classList.remove('tacte'), true);
}
const mm = q => (typeof matchMedia === 'function' ? matchMedia(q) : { matches: false, addEventListener() {}, removeEventListener() {} });
/** Pantalles amples (Chromebook, tablet horitzontal): el missatge de la fase de buscar va a la columna de l'esquerra (T5). */
const AMPLE = mm('(min-width: 1000px)');
/** Pantalles estretes (mòbil): «Comprova» va a la barra de baix, perquè no hi ha columna a l'esquerra. */
const ESTRET = mm('(max-width: 560px)');
/** Després de pintar, durant aquest temps un toc no compta: un doble toc no respon la pregunta que surt sota el dit (T2). */
const BLOQUEIG_MS = 300;

export function creaLlibreta(contenidor, ex, cfg, { onAcaba, onCanvi, estat } = {}) {
    // estat: el d'una sessió desada (auditoria E2): l'exemple continua on era
    const S = estat ? Object.assign(nouEstat(), estat) : nouEstat();
    let acabat = false,
        tsel = null, // terme amb el focus del teclat a la fase del terme
        valorEscrit = '', // el que l'alumne porta escrit a «Corregeix-la» (es conserva en tornar a pintar)
        bloqueig = 0; // fins quan no compten els tocs (T2)
    const n = errades(ex).length;
    const T = TEXTOS[cfg.activitat] || TEXTOS.equacions;
    let ignoraClic = false; // després d'un traç, el clic que el navegador hi afegeix no compta
    contenidor.classList.toggle('encercla', !!cfg.encercla);
    // Una sola regió aria-live per a tots els exercicis, fora de la llibreta (que es torna a pintar sencera): auditoria E3
    let anunci = document.getElementById('anunci-llibreta');
    if (!anunci) {
        anunci = document.createElement('div');
        anunci.id = 'anunci-llibreta';
        anunci.className = 'vh';
        anunci.setAttribute('aria-live', 'polite');
        contenidor.after(anunci);
    }
    let anunciat = '';
    /** Diu al lector de pantalla el missatge nou i la tasca de la fase d'ara (només si han canviat). */
    function anuncia() {
        const cf = consignaFase();
        const t = [S.msg ? textPla(S.msg.text) : '', cf || ''].filter(Boolean).join(' ');
        if (t && t !== anunciat) anunci.textContent = t;
        anunciat = t;
    }
    contenidor.classList.toggle('prioritat', cfg.activitat === 'prioritat');

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
        if (n === 0 || !cfg.anuncia) return [qui + '.', `Si hi ha alguna línia ${T.on}, ${v}-la; si no n'hi ha cap, indica-ho.`];
        if (n === 1) return [qui + ', però ha comès una errada.', `${maj(v)} la primera línia ${T.on}.`];
        return [qui + ', però ha comès dues errades.', `${maj(v)} les dues línies ${T.ons}.`];
    }

    function expr(i) {
        const L = ex.linies[i],
            [esq, igual, dre, des] = parts(L),
            e = ex.errades[i],
            trobada = S.trobades.includes(i);
        // A la fase del terme, els termes de la línia són botons al mateix lloc (sense ampliar-la, R4)
        const tria = S.fase === 'terme' && S.actual === i;
        const cercle = trobada && e && (S.termes[i] || S.ajuda.includes(i));
        const terme = (t, j) =>
            tria
                ? `<button type="button" class="tb${tsel === j ? ' sel' : ''}" data-tm="${j}" aria-label="Terme ${esc(llegible(t))}">${fm(t)}</button>`
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
        return `<span class="corr ex" aria-label="Seria correcte d'aquesta manera: ${esc(llegible(bona))}"><span class="ma">${fm(ba)}</span><span class="t">${igual ? '=' : ''}</span><span class="mb">${fm(bb)}</span></span>`;
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
        // Un cop trobada la primera errada, les línies d'abans ja se sap que són bones: ✓ i sense cercle (B4)
        const primera = errades(ex)[0];
        const bonaFinal = i > 0 && !trobada && (S.fi ? primera === undefined || i < primera : primera !== undefined && i < primera && S.trobades.includes(primera));
        const candidata = i > Math.max(0, ...S.trobades) && !revisada && !S.fi;
        let cls = 'ln' + (i === 0 ? ' enunciat' : '') + (candidata ? '' : ' fora');
        if (trobada) cls += ' err';
        if (S.sel === i) cls += ' sel';
        if (trobada && S.corregides[i]) cls += ' tat';
        if (S.fase === 'terme' && i === S.actual - 1) cls += ' ref';
        let marques = '';
        if (trobada) marques += `<span class="mk e" title="Línia amb errada">✗</span>`;
        else if (revisada || bonaFinal) marques += '<span class="mk c" title="Línia correcta">✓</span>';
        const corr = trobada && S.corregides[i] ? correccio(ex.errades[i].bona) : '';
        // la línia de sobre, a la fase del terme: un rètol que no ocupa lloc (C9)
        const ref = cls.includes(' ref') ? `<span class="etiqueta" aria-hidden="true">${esc(TEXTOS_ETAPA2.compara)}</span>` : '';
        const dins = `<span class="n">${i}</span>${expr(i)}<span class="tags">${marques}</span>${corr}${ref}`;
        const ln = seleccionable(S, ex, i)
            ? `<button type="button" class="${cls}" data-l="${i}" aria-pressed="${S.sel === i}" aria-label="Línia ${i}: ${esc(llegible(ex.linies[i]))}">${dins}</button>`
            : `<div class="${cls}"${i === 0 ? ' title="A l\'enunciat no pot haver-hi cap errada"' : ''}>${dins}</div>`;
        // «Comprova» només surt quan hi ha una línia triada, just a la seva esquerra (el David, 25/11/2026); al mòbil, a la barra
        const cv = S.sel === i && S.fase === 'busca' && !S.fi && !ESTRET.matches ? '<button type="button" class="b pri" data-a="comprova">Comprova</button>' : '';
        // A les pantalles amples, el missatge de la fase de buscar va en aquesta columna, per sobre de res: no mou cap línia (T5)
        const msg = filaMsg === i ? `<div class="msg-cv${cv ? ' amb-b' : ''}${i >= ex.linies.length - 2 ? ' baix' : ''}">${msgHTML()}</div>` : '';
        const atenua = S.fase !== 'busca' && S.fase !== 'fi' && !enJoc(i);
        return `<div class="fila${atenua ? ' atenua' : ''}${cv ? ' amb-cv' : ''}${trobada ? ' trobada' : ''}" data-i="${i}"><div class="cv">${cv}${msg}</div>${ln}</div>`;
    }

    // els missatges s'anuncien des d'una sola regió aria-live que no es torna a crear (auditoria E3): vegeu anuncia()
    const msgHTML = () => `<div class="msg ${S.msg.tipus}">${txt(S.msg.text)}</div>`;

    /** Una pregunta ja contestada: la triada i la correcta, marcades amb text (C6, R1). */
    function respostaHTML(titol, opcions, triada, format, cls = '') {
        const T2 = TEXTOS_ETAPA2;
        // només la triada i la correcta: la tercera no hi afegeix res (pantalla més neta, el David 28/11/2026)
        return `<div class="resposta"><p class="resposta-t">${esc(titol)}</p><ul class="resp">${opcions
            .map(([t, bona], j) => {
                if (!bona && j !== triada) return '';
                const et = bona ? (j === triada ? T2.laTevaCorrecta : T2.laCorrecta) : T2.laTeva;
                return `<li class="${bona ? 'bona' : 'triada'}"><span class="tx${cls}">${format(t)}</span><span class="et">${esc(et)}</span></li>`;
            })
            .join('')}</ul></div>`;
    }

    /**
     * Tot el que va sota la línia i, en un sol bloc (C2): les preguntes ja contestades (C6), el missatge (el que acaba
     * de passar) i la pregunta d'ara. Sense res de tot això, només el missatge.
     */
    function blocHTML(i) {
        const e = ex.errades[i],
            r = S.respostes[i] || {},
            ara = S.actual === i && !S.fi && S.fase !== 'busca';
        let h = '';
        if (e && r.perque !== undefined) h += respostaHTML('Per què és una errada?', e.perque, r.perque, txt);
        if (e && r.corregeix !== undefined) h += respostaHTML(`Com hauria de quedar la línia ${i} per ser correcta?`, e.opcions, r.corregeix, fm, ' mat');
        h += msgHTML();
        if (ara) h += faseHTML();
        return `<div class="sota"><div class="bloc">${h}</div></div>`;
    }

    /** Els passos de cada errada, amb el d'ara marcat (C1): ✓ Línia › Terme › Per què › Corregeix. */
    function pasHTML() {
        const P = TEXTOS_ETAPA2.passos.filter((p, k) => (k === 2 ? cfg.perque : k === 3 ? cfg.corregeix : true));
        // en un exemple sense errades, al final només s'ha fet el pas de la línia (auditoria E2)
        const ara = S.fi ? (n ? P.length : 1) : { busca: 0, terme: 1, perque: 2, corregeix: cfg.perque ? 3 : 2 }[S.fase] ?? 0;
        // text simple, sense requadres: «✓ Línia › Terme › Per què › Corregeix» (pantalla més neta, el David 28/11/2026)
        return `<ol class="passos" aria-label="Passos">${P.map(
            (p, k) => `<li class="${k < ara ? 'fet' : k === ara ? 'ara' : ''}"${k === ara ? ' aria-current="step"' : ''}>${k < ara ? '✓ ' : ''}${esc(p)}</li>`
        ).join('')}</ol>`;
    }

    /** Què ha de fer ara l'alumne, a les fases (C1); a la fase de buscar, la consigna del David. */
    function consignaFase() {
        if (S.fi || S.fase === 'busca') return null;
        const T2 = TEXTOS_ETAPA2;
        if (S.fase === 'terme') return T2.terme(S.actual);
        if (S.fase === 'perque') return T2.perque;
        return escriuAra(S, ex, cfg) ? T2.escriu : T2.corregeix(S.actual);
    }

    /**
     * La demostració del traç (C8): el primer cop en aquest navegador, un cercle es dibuixa sol al voltant de
     * l'enunciat (la línia 0, que no pot tenir cap errada: no dona cap pista) i s'esborra.
     */
    function demo() {
        if (demoFeta || !cfg.encercla) return;
        try {
            if (localStorage.getItem(DEMO_CLAU)) return;
        } catch (e) {
            /* sense localStorage, es mostra cada cop que s'obre la pàgina */
        }
        const lin = contenidor.querySelector('.linies'),
            ts = [...contenidor.querySelectorAll('.fila[data-i="0"] .ex .t')].filter(t => t.textContent.trim());
        if (!lin || !ts.length || S.sel !== null || S.msg || S.fase !== 'busca') return;
        demoFeta = true;
        try {
            localStorage.setItem(DEMO_CLAU, '1');
        } catch (e) {
            /* res */
        }
        const r = lin.getBoundingClientRect(),
            q = ts.map(t => t.getBoundingClientRect()),
            x0 = Math.min(...q.map(b => b.left)) - r.left,
            x1 = Math.max(...q.map(b => b.right)) - r.left,
            y0 = Math.min(...q.map(b => b.top)) - r.top,
            y1 = Math.max(...q.map(b => b.bottom)) - r.top;
        const cx = (x0 + x1) / 2,
            cy = (y0 + y1) / 2,
            rx = (x1 - x0) / 2 + 22,
            ry = (y1 - y0) / 2 + 10;
        const el = document.createElement('div');
        el.className = 'demo';
        el.setAttribute('aria-hidden', 'true');
        const u = v => v.toFixed(1);
        const ellipse = `<ellipse pathLength="1" cx="${u(cx)}" cy="${u(cy)}" rx="${u(rx)}" ry="${u(ry)}" transform="rotate(-4 ${u(cx)} ${u(cy)})"/>`;
        el.innerHTML = `<svg>${ellipse}</svg><span class="etiqueta">${esc(TEXTOS_ETAPA2.demo)}</span>`;
        // la posició, per CSSOM i no amb un atribut style: la Content-Security-Policy no permet estils en línia (auditoria 2, C7)
        const et = el.querySelector('.etiqueta');
        et.style.left = Math.max(0, cx - rx).toFixed(0) + 'px';
        et.style.top = (cy + ry + 6).toFixed(0) + 'px';
        lin.append(el);
        const treu = () => el.remove();
        setTimeout(treu, 4200);
        contenidor.addEventListener('pointerdown', treu, { once: true });
    }
    /** Un missatge de la fase de buscar (la línia bona, «revisa les de sobre», el traç…): no obre cap fase sota la línia. */
    const msgBusca = () => !!S.msg && !S.fi && S.fase === 'busca';
    let filaMsg = null; // la fila on va el missatge, a les pantalles amples (la calcula pinta())

    /** Pantalles estretes (T5): el missatge i, al mòbil, «Comprova», en una barra fixa a baix, que no mou res. */
    function barraHTML() {
        const ambCv = S.sel !== null && S.fase === 'busca' && !S.fi && ESTRET.matches;
        const ambMsg = msgBusca() && !AMPLE.matches;
        if (!ambCv && !ambMsg) return '';
        const k = S.msgLinia ?? S.sel;
        return `<div class="barra-msg">${k !== null ? `<span class="n" aria-label="Línia ${k}">${k}</span>` : ''}<div class="barra-cos">${ambMsg ? msgHTML() : ''}</div>${
            ambCv ? '<button type="button" class="b pri" data-a="comprova">Comprova</button>' : ''
        }</div>`;
    }

    function faseHTML() {
        const e = ex.errades[S.actual];
        // errades compensades: la línia s'ha de comparar amb la de sobre tal com està escrita (el David, 26/11/2026)
        const k = arrossega(ex, S.actual),
            avis = k === null ? '' : `<p class="pista">Compara-la amb la línia ${S.actual - 1} tal com està escrita, encara que arrossegui l'errada de la línia ${k}.</p>`;
        // «Toca'l a la línia N» ja no hi és: ho diu la consigna de dalt (auditoria C1, C2)
        if (S.fase === 'terme') return `<div class="fase"><h3>Quin terme està malament?</h3>${avis}</div>`;
        if (S.fase === 'perque')
            return `<div class="fase"><h3>Per què és una errada?</h3>${avis}<div class="opc">${e.perque
                .map(([t], j) => `<button type="button" class="b" data-pq="${j}">${txt(t)}</button>`)
                .join('')}</div></div>`;
        if (escriuAra(S, ex, cfg))
            return `<div class="fase escriu"><h3>Com hauria de ser el terme encerclat per ser correcte?</h3>${avis}
<form class="escriu-fila" data-escriu><label class="vh" for="escrit">El terme correcte</label>
<input id="escrit" class="escrit" type="text" autocomplete="off" spellcheck="false" inputmode="${esTactil() ? 'none' : 'text'}" placeholder="per exemple, ${T.exemple}">
<button type="submit" class="b pri">Comprova</button></form>
<div class="teclat${T.teclat.length === 12 ? ' t12' : ''}" aria-label="Teclat">${T.teclat
                .map(k => `<button type="button" class="b tk" data-k="${k}">${k}</button>`)
                .join('')}</div></div>`;
        if (S.fase === 'corregeix')
            return `<div class="fase"><h3>Com hauria de quedar la línia ${S.actual} per ser correcta?</h3>${avis}<div class="opc">${e.opcions
                .map(([t], j) => `<button type="button" class="b mat" data-co="${j}">${fm(t)}</button>`)
                .join('')}</div></div>`;
        return '';
    }

    /** Desplaça la finestra el mínim perquè es vegi el bloc [des, fins] (sense la franja `baix` de sota); si no hi cap, n'ensenya el començament. */
    function fesVisible(des, fins, baix = 0) {
        if (!des || !fins) return;
        // dalt: el que tapa la capçalera fixa (D1); baix: el que tapa la barra fixa de baix (T5)
        const cap = document.querySelector('.barra'),
            dalt = cap ? Math.max(0, cap.getBoundingClientRect().bottom) : 0;
        const marge = 12,
            a = des.getBoundingClientRect().top - marge - dalt,
            b = fins.getBoundingClientRect().bottom + marge,
            alt = innerHeight - baix;
        let dy = 0;
        if (b - a > alt || a < 0) dy = a; // no hi cap (b − a = alçada del bloc + dalt), o és a sobre: el començament
        else if (b > alt) dy = b - alt;
        if (dy) scrollBy({ top: dy, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }

    function pinta() {
        const teniaFocus = contenidor.contains(document.activeElement) || document.activeElement === contenidor;
        const [f1, f2] = consigna();
        let h = `<div class="cap-ex"><div class="fila-ins"><p class="ins">${esc(f1)}</p><div class="chips">`;
        // un sol xip per a les errades (pantalla més neta, el David 28/11/2026): «Trobades: 0 de 1», o «Trobades: 0»
        const q = intentsQueden(S, cfg);
        const boles = '●'.repeat(q) + '○'.repeat(cfg.maxIntents - q);
        h += `<span class="chip">${esc(TEXTOS_ETAPA2.trobades(S.trobades.length, cfg.anuncia ? n : null))}</span>`;
        h += `<span class="chip intents" aria-label="${esc(TEXTOS_ETAPA2.intentsAria(q, cfg.maxIntents))}">${esc(TEXTOS_ETAPA2.intents)}: <span class="punts-i">${boles}</span></span></div></div>`;
        // La consigna de la fase d'ara (C1); la del David hi és sempre, amagada a les fases, perquè l'alçada no canviï
        const cf = consignaFase();
        h += `${pasHTML()}<div class="ins-pila"><p class="ins${cf ? ' amagat' : ''}">${esc(f2)}</p>${cf ? `<p class="ins">${esc(cf)}</p>` : ''}</div></div>`;
        h += `<div class="linies${llacActiu() ? ' llac' : ''}${cfg.encercla ? ' encercla' : ''}">`;
        const arr = inicArrossega();
        const mb = msgBusca();
        filaMsg = mb && AMPLE.matches ? (S.msgLinia ?? 1) : null;
        let msgPosat = false;
        for (let i = 0; i < ex.linies.length; i++) {
            if (i === arr) h += `<div class="arrossega"><span class="etiqueta" aria-hidden="true">${esc(TEXTOS_ETAPA2.arrossega)}</span>`;
            h += liniaHTML(i);
            // El missatge i la fase, just a sota de la línia de què parlen: així la línia anterior, la línia,
            // el missatge i les opcions queden junts i caben a la pantalla. Els de la fase de buscar no hi van (T5).
            if (S.msg && !mb && S.msgLinia === i) {
                h += blocHTML(i);
                msgPosat = true;
            }
        }
        if (arr !== null) h += '<span class="parent esq" aria-hidden="true"></span><span class="parent dre" aria-hidden="true"></span></div>';
        if (cfg.encercla) h += `<svg class="traca" aria-hidden="true"><path d="${S.traca ? cami(S.traca) : ''}"/></svg>`;
        h += '</div>';
        if (S.msg && !mb && !msgPosat) h += `<div class="sota sense-linia">${msgHTML()}</div>`;
        if (!S.fi && S.fase === 'busca' && (n === 0 || !cfg.anuncia))
            h += `<div class="acc"><button type="button" class="b" data-a="cap">${S.trobades.length ? 'No hi ha cap més errada' : 'No hi ha cap errada'}</button></div>`;
        if (S.fi && ex.nota) h += `<div class="msg info">${txt(ex.nota)}</div>`;
        h += barraHTML();
        contenidor.innerHTML = h;
        bloqueig = performance.now() + BLOQUEIG_MS;
        alinea();
        const escrit = contenidor.querySelector('#escrit');
        if (escrit) {
            escrit.value = valorEscrit;
            if (!puntPrincipalTactil()) escrit.focus({ preventScroll: true });
        } else if (teniaFocus && !S.fi) {
            const b = contenidor.querySelector('.fase .b');
            (b || contenidor).focus({ preventScroll: true });
        }
        // Amb una fase oberta, s'han de veure la línia anterior, la línia equivocada, el missatge i totes les opcions
        const fase = contenidor.querySelector('.fase');
        const barra = contenidor.querySelector('.barra-msg');
        if (fase) fesVisible(contenidor.querySelector(`.fila[data-i="${Math.max(0, S.actual - 1)}"]`), fase);
        else if (filaMsg !== null) fesVisible(contenidor.querySelector(`.fila[data-i="${filaMsg}"]`), contenidor.querySelector('.msg-cv'));
        else if (barra) {
            // la línia de què parla la barra no pot quedar amagada a sota
            const k = S.sel ?? S.msgLinia,
                f = k !== null && contenidor.querySelector(`.fila[data-i="${k}"]`);
            if (f) fesVisible(f, f, barra.getBoundingClientRect().height + 12);
        }
        if (S.fi && !acabat) {
            acabat = true;
            if (typeof onAcaba === 'function') onAcaba(punts(S), S);
        }
        anuncia();
        // la sessió es desa a cada canvi (auditoria E2)
        if (typeof onCanvi === 'function') onCanvi(S);
    }

    // ---------- Encerclar amb el dit (R3) ----------
    const llacActiu = () => !!cfg.encercla && !S.fi && S.fase === 'busca';
    const cami = pts => 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
    let dib = null; // { lin, r, id, pts, actiu }
    function llacInici(ev) {
        if (!llacActiu() || ev.button > 0) return;
        const lin = ev.target.closest('.linies');
        // el traç comença sobre una línia; la columna de l'esquerra és per desplaçar la pàgina amb el dit (T3)
        if (!lin || !contenidor.contains(lin) || ev.target.closest('[data-a]') || !ev.target.closest('.ln')) return;
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
            // mentre es dibuixa, cap línia no es veu marcada: es marca quan s'aixeca el dit (el David, 26/11/2026)
            contenidor.classList.add('dibuixant');
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
        contenidor.classList.remove('dibuixant');
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
        else if (res.linia === 0) llacDubtos(S, "en l'enunciat no pot haver-hi cap errada.");
        else if (!seleccionable(S, ex, res.linia)) llacDubtos(S, 'aquesta línia ja està revisada.');
        else marcaLlac(S, ex, res.linia, res.termes, d.pts);
        pinta();
    }
    function llacCancel(ev) {
        if (dib && ev.pointerId === dib.id) {
            dib = null;
            contenidor.classList.remove('dibuixant');
            pinta();
        }
    }

    function clic(ev) {
        // ev.detail = 0: un clic del teclat (Enter, espai), que no es bloqueja
        if (ignoraClic || (ev.detail > 0 && performance.now() < bloqueig)) return;
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
            // les zones tàctils (44 px) de dos termes estrets es poden encavalcar: mana el terme que hi ha sota el dit
            let tm = +d.tm;
            if (ev.detail > 0) {
                const sota = [...(b.closest('.fila') || b.parentElement).querySelectorAll('.tb')].find(t => {
                    const q = t.getBoundingClientRect();
                    return ev.clientX >= q.left && ev.clientX <= q.right && ev.clientY >= q.top && ev.clientY <= q.bottom;
                });
                if (sota) tm = +sota.dataset.tm;
            }
            triaTerme(S, ex, cfg, tm);
        } else if (d.l !== undefined) {
            // tornar a tocar la línia triada també és «Comprova» (auditoria C10)
            if (S.sel === +d.l && S.fase === 'busca') comprova(S, ex, cfg);
            else selecciona(S, ex, +d.l);
        }
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
    // en passar d'una mida de pantalla a una altra, el missatge i «Comprova» canvien de lloc
    AMPLE.addEventListener('change', pinta);
    ESTRET.addEventListener('change', pinta);
    // la demostració del traç, quan les lletres ja hi són (el cercle es calcula sobre la mida real dels termes)
    if (document.fonts && document.fonts.ready)
        document.fonts.ready.then(() => {
            alinea();
            demo();
        });
    else demo();
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
            AMPLE.removeEventListener('change', pinta);
            ESTRET.removeEventListener('change', pinta);
        },
    };
}
