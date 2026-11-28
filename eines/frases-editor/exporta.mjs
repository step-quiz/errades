// Passa les frases de l'editor «Frases de "Per què és una errada?" · Equacions» al web:
// js/equacions/frases-dades.js (no l'editis a mà: torna a executar aquest fitxer).
//
//   node eines/frases-editor/exporta.mjs
//
// Entrades:
// - eines/frases-editor/dades.json: el catàleg de l'editor (les situacions per defecte i les condicions).
// - eines/frases-editor/editor-2026-11-28.txt: el que torna «Copia els canvis» de l'editor (el David, 28/11/2026).
// - CANVIS: les correccions que el David va aprovar a l'artifact «Revisió de les frases» (28/11/2026).
import fs from 'node:fs';
const DIR = new URL('./', import.meta.url);
const ARREL = new URL('../../', import.meta.url);
const dades = JSON.parse(fs.readFileSync(new URL('dades.json', DIR), 'utf8'));
const editor = fs.readFileSync(new URL('editor-2026-11-28.txt', DIR), 'utf8').split('\n');

const F = Object.fromEntries(dades.frases.map(f => [f.id, f.text]));
const SIT = {};
for (const s of dades.situacions) SIT[s.id] = { bona: s.bona, dolentes: s.dolentes.map(d => ({ ...d })) };
const condDefecte = {};
for (const s of dades.situacions) for (const d of s.dolentes) if (d.cond) condDefecte[s.id + '/' + d.id] = d.cond;
for (const l of editor) {
    let m = /^([FNR][A-Za-z0-9]+)(?: \(nova\))?: (.*)$/.exec(l);
    if (m) {
        F[m[1]] = m[2];
        continue;
    }
    m = /^([A-Z0-9]+) .*?: bona (\S+); distractors ([^·]*)/.exec(l);
    if (m && SIT[m[1]]) SIT[m[1]] = { bona: m[2], dolentes: m[3].split(',').map(x => ({ id: x.trim() })).filter(x => x.id) };
}

// ---- Revisió de les frases (28/11/2026): els punts aprovats ----
const CANVIS = {
    F40: 'Els nombres \\bold{no es poden sumar} amb els termes que contenen $x$.', // B1
    R44DSIG2: "$[operació]$ fa $\\oposite{[escrit]}$: per tant, s'ha \\bold{equivocat en el signe}.", // B2
    F65: "Hauria d'haver \\bold{restat} $[A sense signe]$ a $[B]$.", // B3
    Nmwyqnmvt9f: "Hauria d'haver sumat en primer lloc $[terme]$ i $[altre terme]$.", // B5
    F16: "L'errada és que [al membre] [costat] hi hauria d'haver \\oposite{$[terme]$}.", // B6
    R16ST2: 'El \\oposite{$[segon terme]$} no és correcte, [al membre] [costat].', // B6
    F43: '[Al membre] [costat] \\bold{falta sumar} una $[x sola]$.', // B6, B7
    F45: "L'errada és que els termes [del membre] [costat] no es poden sumar.", // B6, B7
    F26: "S'ha equivocat amb el $\\oposite{[altre terme]}$.", // B8
    R01TNS1: "Hauria d'haver \\bold{restat} $[n]$ a $[x]$.", // Q1
    F12: "Hauria d'haver aplicat la propietat distributiva, i multiplicat $[c]$ per [x].", // Q3
    // Claude, 28/11/2026 (confirmat pel David): amb un terme positiu (+7 copiat com a −7), «\nosign» deia «escriure 7»
    F25: 'És una errada escriure $[mal]$, hauria de ser $[terme]$.',
    // Claude, 28/11/2026 (confirmat pel David): la bona de CAL2 (F49) diu una cosa falsa en aquesta situació
    C01: '$[a]$ i $[b]$ tenen \\bold{signes diferents}: per tant, s\'han de restar els seus valors.',
    // reserva d'ST1 (F20 amb la paraula de l'índex)
    F20: "Tots els termes, també els nombres, s'han de passar [al membre] de l'esquerra.",
};
Object.assign(F, CANVIS);
SIT.CAL2 = { bona: 'C01', dolentes: SIT.CAL2.dolentes.filter(d => d.id !== 'F49') };
// Claude, 28/11/2026 (confirmat pel David): frases de reserva quan, amb les condicions, queden menys de 3 distractors
const RESERVA = { ST1: ['F18', 'F20'], CAL1: ['F51'], DSIG1: ['F08'] };

// Q4: tipografia
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
    // les que depenen d'un valor que pot faltar ([altre terme], [altre càlcul]) no cal dir-les: la frase no surt
    'una per cada altra suma de la línia': null,
    'només si en aquesta línia ha passat un altre terme': null,
    "només si no n'ha passat cap altre": null,
};

// Q5: un sol id per a cada text (es queda el primer en ordre: F…, després N…, després R…)
const usats = new Set();
for (const s of Object.values(SIT)) [s.bona, ...s.dolentes.map(d => d.id), ...(RESERVA[s.id] || [])].forEach(id => usats.add(id));
for (const [sid, r] of Object.entries(RESERVA)) r.forEach(id => usats.add(id));
const ordre = id => ({ F: 0, C: 1, N: 2, R: 3 })[id[0]] + id;
const canonic = {},
    perText = {};
for (const id of [...usats].sort((a, b) => (ordre(a) < ordre(b) ? -1 : 1))) {
    if (F[id] === undefined) throw new Error('falta la frase ' + id);
    const t = neteja(F[id]);
    perText[t] ??= id;
    canonic[id] = perText[t];
}
const frases = {};
const situacions = {};
for (const [sid, s] of Object.entries(SIT)) {
    const dol = [];
    for (const d of s.dolentes) {
        const id = canonic[d.id];
        const c0 = condDefecte[sid + '/' + d.id];
        if (c0 !== undefined && !(c0 in COND)) throw new Error('condició desconeguda: ' + c0);
        let cond = c0 ? COND[c0] : null;
        if (!cond && F[id].includes('{[A]|[B]}')) cond = 'AdiferentB';
        if (!dol.some(x => x.id === id)) dol.push(cond ? { id, cond } : { id });
    }
    situacions[sid] = { bona: canonic[s.bona], dolentes: dol, ...(RESERVA[sid] ? { reserva: RESERVA[sid].map(id => canonic[id]) } : {}) };
}
for (const s of Object.values(situacions)) for (const id of [s.bona, ...s.dolentes.map(d => d.id), ...(s.reserva || [])]) frases[id] = neteja(F[id]);
const ordenat = Object.fromEntries(Object.entries(frases).sort(([a], [b]) => (ordre(a) < ordre(b) ? -1 : 1)));
const js = `// GENERAT per eines/frases-editor/exporta.mjs a partir de l'editor de frases (el David, 28/11/2026).
// No l'editis a mà: canvia l'editor o exporta.mjs i torna'l a executar.
// frases: id → plantilla (llenguatge de plantilles: js/equacions/frases.js).
// situacions: id → { bona, dolentes: [{ id, cond? }], reserva? }. cond: exp | red1 | tra (el pas),
// xPositiva | xNegativa (la x sola), AdiferentB (|A| ≠ |B|). Una frase amb un valor que falta no surt.
export const FRASES = ${JSON.stringify({ frases: ordenat, situacions }, null, 1)};
`;
fs.writeFileSync(new URL('js/equacions/frases-dades.js', ARREL), js);
console.log(Object.keys(ordenat).length, 'frases,', Object.keys(situacions).length, 'situacions');
