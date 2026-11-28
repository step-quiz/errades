/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/equacions/frases.js
 * ROL: Les frases de «Per què és una errada?» de les equacions, escrites pel
 *      David a l'editor «Frases de "Per què és una errada?" · Equacions»
 *      (eines/frases-editor/), passades a text per a l'alumne. Pur, sense DOM.
 * ARQUITECTURA:
 * - Dades: js/equacions/frases-dades.js (generat per eines/frases-editor/exporta.mjs;
 *   no s'edita a mà). Cada situació té una frase bona, distractors (amb una
 *   condició opcional) i, si cal, frases de reserva.
 * - Llenguatge de plantilles (el mateix que l'editor):
 *   [nom]      un valor de l'exemple; fora de $…$ es posa en fórmula sol
 *              (tret que el valor ja porti $ o sigui text, com [costat]).
 *   $…$        fórmula; ${a|b}$ una fracció.
 *   -          un guionet davant d'una xifra, x, $, [ o \, o entre espais, es converteix en −.
 *   \bold{…}   negreta (surt com **…**, que pinta js/motor/llibreta.js).
 *   \oposite{…} l'oposat amb el signe a la vista (−1 → +1, x → −x).
 *   \signe{…}  el valor amb el signe a la vista (3 → +3).
 *   \nosign{…} el valor sense signe (−23 → 23).
 *   [mal] [bo] el terme mal escrit i com havia de ser.
 *   [abans|alumne|bona].[esq|dre].n  el terme n (des d'1) d'un membre d'una línia.
 *   [membre] [membres] [el membre] [al membre] [Al membre] [del membre]
 *   [l'altre membre] [el seu membre] [al seu membre] [els dos membres]
 *              la paraula triada a l'índex (membre, costat, banda, part).
 *              Es deixen tal qual i les resol posaParaula() a la pàgina.
 * - Un valor negatiu just després d'un operador (+ − ·, i «:» dins d'una fórmula) va entre parèntesis:
 *   «42 − (−14)».
 * - Una frase amb un valor que en aquest exemple no existeix (p. ex. [altre terme]
 *   quan no ha passat cap altre terme) no surt. Si queden menys de 2 distractors,
 *   s'afegeixen els de la reserva de la situació.
 * DEPENDÈNCIES: frases-dades.js.
 * ============================================================================
 */
import { FRASES } from './frases-dades.js';

// ---------- La paraula «membre» (el David, 27/11/2026) ----------
export const PARAULES = {
    membre: { m: true, s: 'membre', p: 'membres' },
    costat: { m: true, s: 'costat', p: 'costats' },
    banda: { m: false, s: 'banda', p: 'bandes' },
    part: { m: false, s: 'part', p: 'parts' },
};
export const MARCADORS_MEMBRE = ['membre', 'membres', 'el membre', 'al membre', 'Al membre', 'del membre', "l'altre membre", 'el seu membre', 'al seu membre', 'els dos membres'];
export function formaMembre(nom, paraula = 'membre') {
    const w = PARAULES[paraula] || PARAULES.membre,
        m = w.m;
    return {
        membre: w.s,
        membres: w.p,
        'el membre': (m ? 'el ' : 'la ') + w.s,
        'al membre': (m ? 'al ' : 'a la ') + w.s,
        'Al membre': (m ? 'Al ' : 'A la ') + w.s,
        'del membre': (m ? 'del ' : 'de la ') + w.s,
        "l'altre membre": (m ? "l'altre " : "l'altra ") + w.s,
        'el seu membre': (m ? 'el seu ' : 'la seva ') + w.s,
        'al seu membre': (m ? 'al seu ' : 'a la seva ') + w.s,
        'els dos membres': (m ? 'els dos ' : 'les dues ') + w.p,
    }[nom];
}
const RE_MEMBRE = new RegExp('\\[(' + MARCADORS_MEMBRE.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\]', 'g');
/** Canvia els marcadors de «membre» per la paraula triada. */
export const posaParaula = (text, paraula = 'membre') => String(text).replace(RE_MEMBRE, (m, n) => formaMembre(n, paraula));
/** Un exemple (generat o del banc) amb la paraula triada a les frases de «Per què?». */
export function exempleAmbParaula(ex, paraula = 'membre') {
    const errades = {};
    for (const [j, e] of Object.entries(ex.errades || {})) errades[j] = e.perque ? { ...e, perque: e.perque.map(([t, b]) => [posaParaula(t, paraula), b]) } : e;
    return { ...ex, errades };
}

// ---------- Valors ----------
// els valors que són text (no fórmula) quan van fora de $…$
const TEXT = new Set(['costat']);
const neteja = v => String(v).replace(/\$/g, '').replace(/-/g, '−').trim();
function termes(v) {
    v = neteja(v);
    let sg = '+';
    if (v[0] === '+' || v[0] === '−') {
        sg = v[0];
        v = v.slice(1).trim();
    }
    const parts = v.split(/ ([+−]) /),
        out = [[sg, parts[0]]];
    for (let i = 1; i < parts.length; i += 2) out.push([parts[i], parts[i + 1]]);
    return out;
}
const escriuTermes = (ts, explicit) =>
    ts.length === 1 ? (explicit || ts[0][0] === '−' ? ts[0][0] : '') + ts[0][1] : ts.map(([g, c], i) => (i === 0 ? (g === '−' ? '−' : '') + c : ` ${g} ${c}`)).join('');
export const oposat = v => escriuTermes(termes(v).map(([g, c]) => [g === '+' ? '−' : '+', c]), true);
export const ambSigne = v => escriuTermes(termes(v), true);
export const senseSigne = v => neteja(v).replace(/^[+−]\s*/, '');

/** El darrer caràcter escrit, sense espais ni $: per saber si un valor va després d'un operador. */
const darrer = s => {
    for (let i = s.length - 1; i >= 0; i--) if (s[i] !== ' ' && s[i] !== '$') return s[i];
    return '';
};
const OPERADOR = new Set(['+', '−', '·']);
// dins d'una fórmula, «:» també és un operador (fora, és un signe de puntuació)
function valor(v, abans, dins = false) {
    const t = neteja(v);
    const d = darrer(abans);
    if (!OPERADOR.has(d) && !(dins && abans.trimEnd().endsWith(':'))) return null;
    if (t[0] === '+') return t.slice(1);
    if (t[0] === '−' && !/ [+−] /.test(t)) return '(' + t + ')';
    return null;
}
/** Substitueix els [valors]; un marcador de «membre» es deixa. Torna null si en falta algun. */
function posaValors(text, valors) {
    let out = '',
        dins = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '$') {
            dins = !dins;
            out += ch;
            continue;
        }
        if (ch === '[') {
            const j = text.indexOf(']', i);
            if (j > i) {
                const n = text.slice(i + 1, j);
                if (MARCADORS_MEMBRE.includes(n)) {
                    out += '[' + n + ']';
                    i = j;
                    continue;
                }
                const v = valors[n];
                if (v === undefined || v === null || v === '') return null;
                const s = String(v);
                if (TEXT.has(n) || s.includes('$')) out += dins ? s.replace(/\$/g, '') : s;
                else {
                    const w = valor(s, out, dins) ?? neteja(s);
                    out += dins ? w : '$' + w + '$';
                }
                i = j;
                continue;
            }
        }
        out += ch;
    }
    return out;
}
// \bold{…} → ⟦…⟧ (marques provisionals), \oposite{…}, \signe{…}, \nosign{…}
function macros(t, dins0 = false) {
    let out = '',
        dins = dins0;
    for (let i = 0; i < t.length; i++) {
        const ch = t[i];
        if (ch === '$') {
            dins = !dins;
            out += ch;
            continue;
        }
        const m = /^\\(bold|oposite|signe|nosign)\{/.exec(t.slice(i, i + 9));
        if (m) {
            let k = i + m[0].length,
                prof = 1;
            for (; k < t.length && prof; k++) {
                if (t[k] === '{') prof++;
                else if (t[k] === '}') prof--;
            }
            const arg = macros(t.slice(i + m[0].length, k - 1), dins);
            if (m[1] === 'bold') out += '\u0003' + arg.trim() + '\u0004' + (/\s$/.test(arg) ? ' ' : '');
            else {
                const r0 = m[1] === 'oposite' ? oposat(arg) : m[1] === 'nosign' ? senseSigne(arg) : ambSigne(arg);
                const r = valor(r0, out, dins) ?? r0;
                out += dins ? r : '$' + r + '$';
            }
            i = k - 1;
            continue;
        }
        out += ch;
    }
    return out;
}
/**
 * Una plantilla → el text per a l'alumne ($…$ i **negreta**), o null si li falta algun valor.
 * La negreta no travessa mai un $: es tanca i es torna a obrir.
 */
export function render(plantilla, valors = {}) {
    const ambMenys = String(plantilla).replace(/-(?=[\dx$[\\(])/g, '−').replace(/ - /g, ' − ');
    const v = posaValors(ambMenys, valors);
    if (v === null) return null;
    let t = macros(v);
    // negreta: dins de la marca, cada $ la talla
    t = t.replace(/\u0003([^\u0004]*)\u0004/g, (m, a) => '**' + a.replace(/\$/g, '**$**') + '**').replace(/\*\*\*\*/g, '');
    return t.replace(/ {2,}/g, ' ').trim();
}

// ---------- Les situacions de cada regla ----------
const menys = n => (n < 0 ? '−' + Math.abs(n) : String(n));
const entreP = n => (n < 0 ? '(' + menys(n) + ')' : String(n));
/** Les fitxes d'una línia («+ 26», «− 7x») → els termes amb el signe enganxat («+26», «−7x»). */
const terme = f => String(f).replace(/^([+−]) /, '$1');
function posicions(nom, fitxes, v) {
    const q = fitxes.indexOf('=');
    const [E, D] = q < 0 ? [[], fitxes] : [fitxes.slice(0, q), fitxes.slice(q + 1)];
    E.forEach((f, j) => (v[`${nom}.esq.${j + 1}`] = terme(f)));
    D.forEach((f, j) => (v[`${nom}.dre.${j + 1}`] = terme(f)));
}
const COSTAT = { L: "de l'esquerra", R: 'de la dreta' };

/**
 * La situació i els valors d'una errada: { sid, valors, conds }, o null si la regla
 * no té cap situació a l'editor (el generador ho considera un error).
 * d: dades de la regla; ctx: { op, abans (línia), T (eines de text del generador) }.
 */
export function situacio(id, d, ctx) {
    const T = ctx.T;
    const conds = new Set([ctx.op]);
    switch (id) {
        case 'DISTRIBUTIVA': {
            const t = d.t;
            return { sid: 'DIST', conds, valors: { c: menys(t.c), b: menys(t.b), 'la x': t.m === 1 ? 'la $x$' : `$${t.m}x$`, x: t.m === 1 ? 'x' : t.m + 'x', escrit: menys(t.b) } };
        }
        case 'DIST_SIGNE': {
            const t = d.t,
                x = t.m === 1 ? 'x' : t.m + 'x';
            const c = ctx.abans.L.includes(t) ? 'L' : 'R',
                i = ctx.abans[c].indexOf(t);
            const altre = ctx.abans[c === 'L' ? 'R' : 'L'];
            const ab = i > 0 ? ctx.abans[c][i - 1] : null;
            const base = { b: menys(t.b), x, 'la x': t.m === 1 ? 'la $x$' : `$${x}$`, 'de la x': t.m === 1 ? 'de la $x$' : `del $${x}$`, 'altre membre': T.sumaTx(altre) };
            if (t.c === -1) return { sid: 'DSIG1', conds, valors: { ...base, "terme d'abans": ab ? T.pTx(ab) : null } };
            const mal = -t.c * t.b;
            return {
                sid: 'DSIG2',
                conds,
                valors: { ...base, c: menys(t.c), operació: `${entreP(t.c)} · ${entreP(t.b)}`, escrit: mal > 0 ? '+' + mal : menys(mal), 'terme en x': menys(t.c * t.m) + 'x' },
            };
        }
        case 'DIST_SUMA': {
            const t = d.t;
            return {
                sid: 'DSUMA',
                conds,
                valors: {
                    c: menys(t.c),
                    'c sense signe': String(Math.abs(t.c)),
                    m: String(t.m),
                    b: menys(t.b),
                    'la x': `$${t.m}x$`,
                    x: t.m + 'x',
                    escrit: T.pTx(d.mal),
                    producte: `${entreP(t.c)} · ${entreP(t.b)}`,
                    'valor del producte': menys(t.c * t.b),
                },
            };
        }
        case 'SIGNE_TRANSPOSAR': {
            const costat = t => COSTAT[t.k === 'x' ? 'L' : 'R'];
            if (d.tots)
                return {
                    sid: 'ST2',
                    conds,
                    valors: {
                        'els termes': T.llistaTermes(d.tots),
                        'Els termes': T.llistaTermes(d.tots, true),
                        'primer terme': T.ambSigne(d.tots[0]),
                        'segon terme': T.ambSigne(d.tots[1]),
                        costat: costat(d.tots[1]),
                    },
                };
            const u = d.altres && d.altres[0];
            return { sid: 'ST1', conds, valors: { terme: T.ambSigne(d.t), 'altre terme': u ? T.ambSigne(u) : null, costat: costat(d.t) } };
        }
        case 'SIGNE_COPIAT': {
            if (d.ts.length > 1)
                return {
                    sid: 'SC2',
                    conds,
                    valors: { 'els termes': T.llistaTermes(d.ts), 'Els termes': T.llistaTermes(d.ts, true), 'primer terme': T.ambSigne(d.ts[0]), 'segon terme': T.ambSigne(d.ts[1]) },
                };
            // [altre terme]: un terme que en aquest pas ha passat bé a l'altre membre (només en passar termes)
            let altre = null;
            if (d.op === 'tra') {
                const mou = [...ctx.abans.L.filter(t => t.k === 'n' && !t.v.zero), ...ctx.abans.R.filter(t => t.k === 'x')];
                if (mou.length) altre = T.ambSigne(mou[0]);
            }
            return { sid: 'SC1', conds, valors: { terme: T.ambSigne(d.t), 'altre terme': altre } };
        }
        case 'TERMES_NO_SEMBLANTS': {
            const xs = d.xs && d.xs.map(t => `$${T.pTx(t)}$`);
            const llista = xs && (xs.length > 1 ? xs.slice(0, -1).join(', ') + ' i ' + xs[xs.length - 1] : xs[0]);
            if (d.tres) {
                if (d.ns.length === 1) return { sid: 'TNS2', conds, valors: { terme: T.ambSigne(d.ns[0]), 'termes en x': llista } };
                return { sid: 'TNS3', conds, valors: { 'termes en x': llista } };
            }
            const c = d.x.c.n,
                b = d.n.v.n;
            const suma = T.sumaTx([T.N(c), T.N(b)]);
            return { sid: 'TNS1', conds, valors: { x: T.pTx(d.x), n: T.pTx(d.n), terme: T.ambSigne(d.n), suma, resultat: menys(c + b), càlcul: suma } };
        }
        case 'COEFICIENT_U': {
            const neg = d.u.c.n < 0;
            conds.add(neg ? 'xNegativa' : 'xPositiva');
            return { sid: 'CU', conds, valors: { 'x sola': neg ? '−x' : 'x', '1x': neg ? '−1x' : '1x', suma: d.expr, operació: d.expr, escrit: d.mal ? T.pTx(d.mal) : null, costat: COSTAT[d.costat] } };
        }
        case 'CALCUL': {
            const sid = { signe: 'CAL1', suma: 'CAL2', resta: 'CAL3' }[d.tipus];
            const altre = (d.altres && d.altres[0]) || null;
            return { sid, conds, valors: { suma: d.expr, a: d.a, b: d.b, càlcul: altre, 'altre càlcul': altre, operació: d.expr, escrit: d.mal, costat: COSTAT[d.costat] } };
        }
        case 'OPERACIO_INVERSA': {
            const v = d.v || 'resta';
            const fet = {
                resta: `${menys(d.B)} − ${entreP(d.A)}`,
                inversa: `${menys(d.A)} − ${entreP(d.B)}`,
                producte: `${menys(d.B)} · ${entreP(d.A)}`,
                suma: `${menys(d.B)} + ${entreP(d.A)}`,
            }[v];
            const W = d.W ?? d.B - d.A;
            const sid = { resta: 'OI1', inversa: 'OI1', producte: 'OI3', suma: 'OI4' }[v];
            if (Math.abs(d.A) !== Math.abs(d.B)) conds.add('AdiferentB');
            return { sid, conds, valors: { operació: fet, B: menys(d.B), A: menys(d.A), 'resultat canviat de signe': menys(-W), 'A i B enganxats': `${Math.abs(d.A)}${Math.abs(d.B)}` } };
        }
        case 'COEFICIENT_OBLIDAT':
            if (Math.abs(d.A) !== Math.abs(d.B)) conds.add('AdiferentB');
            return { sid: 'CO', conds, valors: { A: menys(d.A), B: menys(d.B) } };
        case 'DIVISIO_SIGNE':
            if (Math.abs(d.A) !== Math.abs(d.B)) conds.add('AdiferentB');
            return { sid: 'DS', conds, valors: { A: menys(d.A), 'A sense signe': String(Math.abs(d.A)), B: menys(d.B) } };
        case 'SUMA_ABANS_PRODUCTE': {
            const t = d.t,
                dins = `${t.m === 1 ? '' : t.m}x ${t.b < 0 ? '−' : '+'} ${Math.abs(t.b)}`;
            return { sid: 'SAP', conds, valors: { a: String(d.a), c: String(t.c), suma: String(d.s), parèntesi: `(${dins})` } };
        }
        case 'INVERS_X':
            return { sid: 'IX', conds, valors: { a: menys(d.a), B: menys(d.B) } };
        case 'DENOMINADORS':
            if (d.variant === 'signe') return { sid: 'DEN1', conds, valors: { b: menys(d.t.b), M: String(d.M) } };
            return { sid: 'DEN2', conds, valors: { M: String(d.M) } };
        case 'CANVI_SIGNE_PARCIAL':
            return { sid: 'CSP', conds, valors: { terme: T.ambSigne(d.t) } };
        case 'QUOCIENT_INVERTIT':
            conds.add('AdiferentB');
            return { sid: 'QI', conds, valors: { A: menys(d.A), B: menys(d.B), 'B menys A': `${menys(d.B)} − ${entreP(d.A)}`, 'B per A': `${menys(d.B)} · ${entreP(d.A)}` } };
    }
    return null;
}

/** Per a les proves i les eines: amb actiu = true, cada crida es desa a vistes. */
export const DIAGNOSI = { actiu: false, vistes: [] };
/**
 * «Per què?» d'una errada amb les frases de l'editor: { bona, dolentes } (textos per a l'alumne,
 * amb els marcadors de «membre» per resoldre), o null si la regla no en té.
 * linies: { abans, mal, bona } en fitxes; terme: la posició del terme equivocat.
 */
export function perque(id, d, ctx) {
    const s = situacio(id, d, ctx);
    if (!s) return null;
    const S = FRASES.situacions[s.sid];
    const v = { ...s.valors };
    const { linies, terme: k } = ctx;
    if (linies) {
        posicions('abans', linies.abans, v);
        posicions('alumne', linies.mal, v);
        posicions('bona', linies.bona, v);
        if (k >= 0 && linies.mal[k] !== undefined && linies.bona[k] !== undefined) {
            v.mal = terme(linies.mal[k]);
            v.bo = terme(linies.bona[k]);
        }
    }
    const fa = id => render(FRASES.frases[id], v);
    const bona = fa(S.bona);
    if (!bona) throw new Error(`${s.sid}: la frase bona (${S.bona}) no té tots els valors`);
    const vistes = new Set([bona]);
    const dolentes = [];
    const posa = id => {
        const t = fa(id);
        if (t && !vistes.has(t)) {
            vistes.add(t);
            dolentes.push(t);
        }
    };
    for (const x of S.dolentes) if (!x.cond || s.conds.has(x.cond)) posa(x.id);
    for (const id of S.reserva || []) if (dolentes.length < 2) posa(id);
    if (DIAGNOSI.actiu) DIAGNOSI.vistes.push({ sid: s.sid, id, bona, dolentes, valors: v });
    return { bona, dolentes, sid: s.sid };
}
