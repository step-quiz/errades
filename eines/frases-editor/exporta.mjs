// Passa les frases de l'editor «Frases de "Per què és una errada?" · Equacions» al web:
// js/equacions/frases-dades.js (no l'editis a mà: torna a executar aquest fitxer).
//
//   node eines/frases-editor/exporta.mjs
//
// Entrades:
// - eines/frases-editor/dades.json: el catàleg de l'editor (versió 2, 28/11/2026): les frases i les situacions tal com
//   eren quan es va fer l'editor nou, amb les condicions en text i les frases de reserva.
// - eines/frases-editor/editor-db.json (si hi és): el que el David ha escrit a l'editor, tal com el desa l'artifact
//   ({ frases: { id: { text, nova, … } }, situacions: { id: { bona, dolentes: [{ id, cond? }] } } }). Claude el fa
//   llegint les col·leccions «frases» i «situacions» de l'artifact (db_list) quan el David diu «Revisa artifact».
// Història: l'editor antic (un altre compte) es va passar amb editor-2026-11-28.txt; el que deia ja és a dades.json.
import fs from 'node:fs';
const DIR = new URL('./', import.meta.url);
const ARREL = new URL('../../', import.meta.url);
const dades = JSON.parse(fs.readFileSync(new URL('dades.json', DIR), 'utf8'));
if (dades.versio !== 2) throw new Error('dades.json no és el catàleg de l\'editor nou');

const F = Object.fromEntries(dades.frases.map(f => [f.id, f.text]));
const SIT = {};
for (const s of dades.situacions) SIT[s.id] = { bona: s.bona, dolentes: s.dolentes.map(d => ({ ...d })), reserva: s.reserva || [] };
const fitxerDb = new URL('editor-db.json', DIR);
if (fs.existsSync(fitxerDb)) {
    const db = JSON.parse(fs.readFileSync(fitxerDb, 'utf8'));
    for (const [id, f] of Object.entries(db.frases || {})) if (typeof f.text === 'string') F[id] = f.text;
    for (const [id, s] of Object.entries(db.situacions || {}))
        if (SIT[id] && typeof s.bona === 'string' && Array.isArray(s.dolentes)) SIT[id] = { ...SIT[id], bona: s.bona, dolentes: s.dolentes.map(d => ({ id: d.id, ...(d.cond ? { cond: d.cond } : {}) })) };
}

// tipografia (el David, revisió 28/11): sense espais dins de la negreta, sense cometes rectes, «tal com», punt final
const neteja = t => {
    t = t.trim().replace(/\\bold\{([^{}]*?)\s+\}/g, '\\bold{$1} ').replace(/"/g, '').replace(/tal i com/g, 'tal com').replace(/ {2,}/g, ' ').trim();
    if (!/[.?!]$/.test(t)) t += '.';
    return t;
};
const COND = {
    'només si el pas és treure parèntesis': 'exp',
    'només si el pas és agrupar termes': 'red1',
    'només si el pas és passar termes': 'tra',
    'només si la x sola és positiva': 'xPositiva',
    'només si és −x': 'xNegativa',
    'només si A i B no tenen el mateix valor absolut': 'AdiferentB',
    // les que depenen d'un valor que pot faltar ([altre terme], [altre càlcul]) no cal dir-les: la frase no surt
    'una per cada altra suma de la línia': null,
    'només si en aquesta línia ha passat un altre terme': null,
    "només si no n'ha passat cap altre": null,
};

// un sol id per a cada text (es queda el primer en ordre: F…, C…, N…, R…, i la resta)
const ordre = id => ({ F: 0, C: 1, N: 2, R: 3 }[id[0]] ?? 4) + id.padStart(16, '0');
const usats = new Set();
for (const s of Object.values(SIT)) [s.bona, ...s.dolentes.map(d => d.id), ...s.reserva].forEach(id => usats.add(id));
const canonic = {},
    perText = {};
for (const id of [...usats].sort((a, b) => (ordre(a) < ordre(b) ? -1 : 1))) {
    if (F[id] === undefined) throw new Error('falta la frase ' + id);
    const t = neteja(F[id]);
    perText[t] ??= id;
    canonic[id] = perText[t];
}
const situacions = {};
for (const [sid, s] of Object.entries(SIT)) {
    const dol = [];
    for (const d of s.dolentes) {
        const id = canonic[d.id];
        if (d.cond && !(d.cond in COND)) throw new Error(`${sid}: condició desconeguda: ${d.cond}`);
        let cond = d.cond ? COND[d.cond] : null;
        if (!cond && F[id].includes('{[A]|[B]}')) cond = 'AdiferentB';
        if (!dol.some(x => x.id === id)) dol.push(cond ? { id, cond } : { id });
    }
    situacions[sid] = { bona: canonic[s.bona], dolentes: dol, ...(s.reserva.length ? { reserva: s.reserva.map(id => canonic[id]) } : {}) };
}
const frases = {};
for (const s of Object.values(situacions)) for (const id of [s.bona, ...s.dolentes.map(d => d.id), ...(s.reserva || [])]) frases[id] = neteja(F[id]);
const ordenat = Object.fromEntries(Object.entries(frases).sort(([a], [b]) => (ordre(a) < ordre(b) ? -1 : 1)));
const js = `// GENERAT per eines/frases-editor/exporta.mjs a partir de l'editor de frases del David.
// No l'editis a mà: canvia l'editor (o dades.json) i torna a executar exporta.mjs.
// frases: id → plantilla (llenguatge de plantilles: js/equacions/frases.js).
// situacions: id → { bona, dolentes: [{ id, cond? }], reserva? }. cond: exp | red1 | tra (el pas),
// xPositiva | xNegativa (la x sola), AdiferentB (|A| ≠ |B|). Una frase amb un valor que falta no surt.
export const FRASES = ${JSON.stringify({ frases: ordenat, situacions }, null, 1)};
`;
fs.writeFileSync(new URL('js/equacions/frases-dades.js', ARREL), js);
console.log(Object.keys(ordenat).length, 'frases,', Object.keys(situacions).length, 'situacions');
