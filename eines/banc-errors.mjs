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
import { generaExemple as generaEq, perPagina as perPaginaEq, valida as validaEq } from '../js/equacions/generador.js';
import { generaExemple as generaPr, perPagina as perPaginaPr, valida as validaPr } from '../js/prioritat/generador.js';

const VERSIO = 'v1';
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

function equacio(id) {
    const delBanc = BANC.filter(ex => tipusDe(ex).length === 1 && tipusDe(ex)[0] === id && !ex.nota);
    if (delBanc.length) return { ex: triaMillor(delBanc), origen: 'banc' };
    const cands = [];
    for (let s = 1; s <= 3000 && cands.length < 40; s++)
        for (const nivell of [1, 2]) {
            try {
                const ex = generaEq({ llavor: s, nivell, errades: 1, filtre: c => c.id === id }, TIPUS_EQ);
                if (!validaEq(ex).length && Math.max(...nombres(ex)) <= 40) cands.push(perPaginaEq(ex));
            } catch (e) {
                /* una altra llavor */
            }
        }
    return { ex: triaMillor(cands), origen: 'generador' };
}

function prioritat(id) {
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
for (const [seccio, T, fes] of [
    ['equacions', TIPUS_EQ, equacio],
    ['prioritat', TIPUS_PR, prioritat],
]) {
    for (const id of claus(T)) {
        const { ex, origen } = fes(id);
        if (!ex) throw new Error(`Cap exemple per a ${id}`);
        const [j, e] = Object.entries(ex.errades)[0];
        items.push({
            n: ++n,
            seccio,
            id,
            nom: T[id].nom,
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
