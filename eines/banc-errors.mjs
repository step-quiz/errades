// eines/banc-errors.mjs — genera banc-errors.html (a l'arrel): un exemple de cada tipus d'errada de les dues
// activitats, perquè el professorat del departament valori si les situacions estan ben triades.
//
//   node eines/banc-errors.mjs
//
// - Equacions: l'exemple del banc revisat pel David (data/banc.json) amb una sola errada d'aquell tipus, el més
//   curt i de nivell més baix; si el banc no en té cap, el genera (generaExemple amb un filtre).
// - Prioritat d'operacions: no hi ha banc; el genera, amb nombres petits i poques línies.
// - La pàgina és autònoma: dades, CSS, JS i lletres (Kalam, Permanent Marker, en base64) dins del mateix fitxer.
// - VERSIO: canvia-la si canvia el conjunt d'exemples, perquè els codis de preferències diguin a quina versió responen.
import fs from 'node:fs';
import { generaExemple as generaEq, perPagina as perPaginaEq, valida as validaEq, T as TE, text as textEq } from '../js/equacions/generador.js';
import { generaExemple as generaPr, perPagina as perPaginaPr, valida as validaPr, T as TP } from '../js/prioritat/generador.js';

const VERSIO = 'v3';
const arrel = new URL('../', import.meta.url);
const llegeix = f => fs.readFileSync(new URL(f, arrel), 'utf8');
const json = f => JSON.parse(llegeix(f));
const TIPUS_EQ = json('data/errors.json'),
    TIPUS_PR = json('data/errors-prioritat.json'),
    BANC = json('data/banc.json').exemples;
const claus = T => Object.keys(T).filter(k => !k.startsWith('_'));
const tipusDe = ex => Object.values(ex.errades).map(e => e.tipus);
const nombres = ex => ex.linies.flat().join(' ').match(/\d+/g)?.map(Number) || [];

function triaMillor(cands) {
    // menys línies, nivell més baix, nombres més petits
    const punts = ex => ex.linies.length * 100 + (ex.nivell || 1) * 10 + Math.max(0, ...nombres(ex)) / 10;
    return cands.sort((a, b) => punts(a) - punts(b))[0] || null;
}

// Peticions del David (banc d'errades v1, 26/11/2026): exemples concrets per a alguns tipus, i casos de més.
const EQ13 = TE.linia([TE.N(3), TE.P(2, -4)], [TE.X(3), TE.X(1), TE.N(-2)]); // 3 + 2·(x − 4) = 3x + x − 2
// Tres errades noves (el David, 26/11/2026), amb els seus enunciats
const EQ_INV = TE.linia([TE.I(30)], [TE.N(5)]); // 30/x = 5
const EQ_NEG = TE.linia([TE.X(-4), TE.N(5), TE.X(-3)], [TE.N(6), TE.X(-1)]); // −4x + 5 − 3x = 6 − x
const EQ_DEN = TE.linia([TE.D(1, 3, 5, 2), TE.D(-1, 1, -4, 3)], [TE.X(5)]); // (3x + 5)/2 − (x − 4)/3 = 5x
const EXTRA_EQ = {
    INVERS_X: [{ banc: false, e0: EQ_INV }],
    CANVI_SIGNE_PARCIAL: [
        { titol: 'un terme de la dreta', banc: false, e0: EQ_NEG, filtre: c => textEq(c.res.linia) === '4x − 5 + 3x = 6 + x' },
        { titol: "un terme de l'esquerra", banc: false, e0: EQ_NEG, filtre: c => textEq(c.res.linia) === '4x + 5 + 3x = −6 + x' },
    ],
    DENOMINADORS: [
        { titol: 'el signe de davant de la fracció', banc: false, e0: EQ_DEN, filtre: c => c.res.dades.variant === 'signe' },
        { titol: 'els termes sense denominador', banc: false, e0: EQ_DEN, filtre: c => c.res.dades.variant === 'sense' },
    ],
    // 9: sense la complexitat d'un nombre negatiu: 4x = 20 → x = 16
    OPERACIO_INVERSA: [{ banc: false, e0: TE.linia([TE.X(4), TE.N(3)], [TE.N(23)]), filtre: c => textEq(c.res.linia) === 'x = 16' }],
    // 12: el cas de sempre i el «bessó»: 12x = 3 → x = 12/3 (no es pot fer 3 entre 12)
    QUOCIENT_INVERTIT: [{}, { titol: 'cas bessó', banc: false, e0: TE.linia([TE.X(12), TE.N(-5)], [TE.N(-2)]) }],
    // 13 (regla nova): les dues variants
    SUMA_ABANS_PRODUCTE: [
        { titol: 'suma abans de multiplicar', banc: false, e0: EQ13, filtre: c => c.res.dades.variant === 'parentesi' },
        { titol: 'i, a més, només multiplica la x', banc: false, e0: EQ13, filtre: c => c.res.dades.variant === 'x' },
    ],
};
function equacio(id, o = {}) {
    const pred = o.pred || (() => true);
    const delBanc = o.banc === false ? [] : BANC.filter(ex => tipusDe(ex).length === 1 && tipusDe(ex)[0] === id && !ex.nota && pred(ex));
    if (delBanc.length) return { ex: triaMillor(delBanc), origen: 'banc' };
    const origen = o.e0 ? 'fix' : 'generador';
    const cands = [];
    for (let s = 1; s <= 3000 && cands.length < 40; s++)
        for (const nivell of [1, 2]) {
            try {
                const ex = generaEq({ llavor: s, nivell, errades: 1, e0: o.e0 || null, filtre: c => c.id === id && (!o.filtre || o.filtre(c)) }, TIPUS_EQ);
                if (!validaEq(ex).length && (o.e0 || Math.max(...nombres(ex)) <= 40) && pred(ex)) cands.push(perPaginaEq(ex));
            } catch (e) {
                /* una altra llavor */
            }
        }
    return { ex: triaMillor(cands), origen };
}

// 17: una sola potència (el David): 5^2 − 6 : 2 + 3 → 10 − 6 : 2 + 3
const { N: pN, W: pW, it: pit } = TP;
const EXTRA_PR = { POTENCIA_PER_EXPONENT: [{ e0: [pit(null, pW(5, 2)), pit('−', pN(6)), pit(':', pN(2)), pit('+', pN(3))] }] };
function prioritat(id, o = {}) {
    if (o.e0) {
        for (let s = 1; s <= 500; s++)
            try {
                const ex = generaPr({ llavor: s, nivell: 2, errades: 1, e0: o.e0, filtre: c => c.id === id });
                if (!validaPr(ex).length) return { ex: perPaginaPr(ex), origen: 'fix' };
            } catch (e) {
                /* una altra llavor */
            }
    }
    const cands = [];
    for (let s = 1; s <= 4000 && cands.length < 60; s++)
        for (const nivell of [1, 2]) {
            try {
                const ex = generaPr({ llavor: s, nivell, errades: 1, filtre: c => c.id === id });
                if (!validaPr(ex).length && Math.max(...nombres(ex)) <= 60) cands.push(perPaginaPr(ex));
            } catch (e) {
                /* una altra llavor */
            }
        }
    return { ex: triaMillor(cands), origen: 'generador' };
}

const items = [];
let n = 0;
for (const [seccio, T, fes, EXTRA] of [
    ['equacions', TIPUS_EQ, equacio, EXTRA_EQ],
    ['prioritat', TIPUS_PR, prioritat, EXTRA_PR],
]) {
    for (const id of claus(T))
    for (const o of EXTRA[id] || [{}]) {
        const { ex, origen } = fes(id, o);
        if (!ex) throw new Error(`Cap exemple per a ${id} ${o.titol || ''}`);
        const [j, e] = Object.entries(ex.errades)[0];
        items.push({
            n: ++n,
            seccio,
            id,
            nom: T[id].nom + (o.titol ? ` (${o.titol})` : ''),
            descripcio: T[id].descripcio,
            origen,
            alumne: ex.alumne,
            linies: ex.linies,
            j: +j,
            termes: e.termes || [e.terme],
            bona: e.bona,
            expl: e.expl,
        });
    }
}

const b64 = f => fs.readFileSync(new URL(f, arrel)).toString('base64');
const plantilla = llegeix('eines/banc-errors.plantilla.html');
const dades = JSON.stringify({ versio: VERSIO, items }).replace(/</g, '\\u003c');
const html = plantilla
    .replace('/*DADES*/', () => dades)
    .replace('/*KALAM*/', () => b64('vendor/fonts/kalam-latin-400-normal.woff2'))
    .replace('/*MARKER*/', () => b64('vendor/fonts/permanent-marker-latin-400-normal.woff2'));
fs.writeFileSync(new URL('banc-errors.html', arrel), html);
console.log(`banc-errors.html: ${items.length} exemples (${items.filter(i => i.origen === 'banc').length} del banc), ${VERSIO}`);
for (const i of items) console.log(`${String(i.n).padStart(2)} ${i.seccio.padEnd(10)} ${i.id.padEnd(24)} ${i.origen.padEnd(9)} ${i.linies.map(l => l.join(' ')).join('  |  ')}`);
