// Fa el catàleg (dades.json) de l'editor NOU (28/11/2026, al compte d'ara): les frases d'avui com a punt de partida
// (js/equacions/frases-dades.js, amb les correccions aprovades), les situacions de les regles que encara no hi eren
// i les desactivades marcades. Només s'executa una vegada:  node eines/frases-editor/cataleg-2.mjs
import fs from 'node:fs';
import { FRASES } from '../../js/equacions/frases-dades.js';
const FITXER = new URL('dades.json', import.meta.url);
const vell = JSON.parse(fs.readFileSync(FITXER, 'utf8'));
if (vell.versio === 2) throw new Error('dades.json ja és el catàleg de l\'editor nou');
// les condicions, en text per a l'editor (exporta.mjs les torna a passar a claus)
const COND = {
    exp: 'només si el pas és treure parèntesis',
    red1: 'només si el pas és agrupar termes',
    tra: 'només si el pas és passar termes',
    xPositiva: 'només si la x sola és positiva',
    xNegativa: 'només si és −x',
    AdiferentB: 'només si A i B no tenen el mateix valor absolut',
};
const COSTAT = { costat: "«de l'esquerra» o «de la dreta»: on és (o on arriba) el terme" };
const situacions = vell.situacions.map(s => {
    const a = FRASES.situacions[s.id];
    return {
        ...s,
        bona: a.bona,
        dolentes: a.dolentes.map(d => (d.cond ? { id: d.id, cond: COND[d.cond] } : { id: d.id })),
        ...(a.reserva ? { reserva: a.reserva } : {}),
        ...(s.id === 'DSUMA' ? { desactivada: true } : {}),
    };
});
const frases = { ...FRASES.frases };
// ---- Situacions noves: les regles que encara feien servir les frases del codi (PERQUE) ----
let k = 71;
const nova = t => {
    // un text que ja hi és fa servir el mateix id (frase compartida)
    const ja = Object.keys(frases).find(i => frases[i] === t);
    if (ja) return ja;
    const id = 'F' + k++;
    frases[id] = t;
    return id;
};
const sit = (id, tipus, titol, quan, marcadors, mostra, bona, dolentes) =>
    situacions.push({ id, tipus, titol, quan, marcadors, nom: titol, nota: '', mostra: { ...mostra, origen: 'a mà' }, bona: nova(bona), dolentes: dolentes.map(t => ({ id: nova(t) })) });
sit('SAP', 'SUMA_ABANS_PRODUCTE', 'La suma abans que el producte', 'Suma el nombre de davant amb el que multiplica el parèntesi: 3 + 2·(x − 4) → 5·(x − 4).',
    { a: 'el nombre de davant («3»)', c: 'el nombre que multiplica el parèntesi («2»)', suma: 'el que fa la suma («5»)', parèntesi: 'el parèntesi («(x − 4)»)' },
    { abans: '3 + 2·(x − 4) = 3x + x − 2', mal: '5·(x − 4) = 3x + x − 2', bona: '3 + 2x − 8 = 3x + x − 2', valors: { a: '3', c: '2', suma: '5', parèntesi: '(x − 4)' } },
    "Ha sumat $[a] + [c]$ abans de multiplicar: el $[c]$ només multiplica el parèntesi.",
    ["El $[a]$ també s'havia de multiplicar per $[parèntesi]$.", "Primer s'havia de sumar $[a] + [c]$ i després multiplicar.", "Ha multiplicat bé, però s'ha equivocat en un signe.", "El $[c]$ s'havia de sumar a cada terme del parèntesi."]);
sit('IX', 'INVERS_X', 'La x al denominador', 'Passa la x a l\'altre membre multiplicant i hi passa el nombre: 30/x = 5 → x = 30·5.',
    { a: 'el numerador («30»)', B: "el nombre de l'altre membre («5»)" },
    { abans: '{30|x} = 5', mal: 'x = 30·5', bona: '5x = 30', valors: { a: '30', B: '5' } },
    "Ha multiplicat $[a] · [B]$, però la $x$ era al denominador: havia de dividir $[a] : [B]$.",
    ["El $[B]$ havia de passar a [l'altre membre] restant.", "Havia de multiplicar el $[a]$ per la $x$.", "Ha calculat malament $[a] · [B]$."]);
sit('DEN1', 'DENOMINADORS', 'Treure denominadors: el signe de davant de la fracció', 'El − de davant d\'una fracció no canvia el signe de tot el numerador.',
    { b: 'el nombre del numerador que no ha canviat de signe («−4»)', M: 'el mínim comú múltiple dels denominadors («6»)' },
    { abans: '{3x + 5|2} − {x − 4|3} = 5x', mal: '9x + 15 − 2x − 8 = 30x', bona: '9x + 15 − 2x + 8 = 30x', valors: { b: '−4', M: '6' } },
    'El $−$ de davant de la fracció no ha canviat el signe del $[b]$.',
    ['No ha multiplicat per $[M]$ els termes que no tenen denominador.', "S'ha equivocat en calcular el mínim comú múltiple dels denominadors.", 'Havia de dividir per $[M]$, i no multiplicar.']);
sit('DEN2', 'DENOMINADORS', 'Treure denominadors: els termes sense denominador', 'Els termes que no tenen denominador no es multipliquen.',
    { M: 'el mínim comú múltiple dels denominadors («6»)' },
    { abans: '{3x + 5|2} − {x − 4|3} = 5x', mal: '9x + 15 − 2x + 8 = 5x', bona: '9x + 15 − 2x + 8 = 30x', valors: { M: '6' } },
    'No ha multiplicat per $[M]$ els termes que no tenen denominador.',
    ["El $−$ de davant d'una fracció havia de canviar el signe de tot el numerador.", "S'ha equivocat en calcular el mínim comú múltiple dels denominadors.", 'Havia de dividir per $[M]$, i no multiplicar.']);
for (const s of situacions) if (['ST1', 'ST2', 'CU', 'CAL1', 'CAL2', 'CAL3'].includes(s.id)) Object.assign(s.marcadors, COSTAT);
// usos de cada frase, per a l'editor
const llista = Object.entries(frases).map(([id, text]) => ({ id, text, usos: [] }));
const per = Object.fromEntries(llista.map(f => [f.id, f]));
for (const s of situacions) {
    per[s.bona].usos.push([s.id, 'bona']);
    for (const d of s.dolentes) per[d.id].usos.push([s.id, 'dolenta']);
}
fs.writeFileSync(FITXER, JSON.stringify({ versio: 2, situacions, frases: llista, grups: [] }));
console.log(situacions.length, 'situacions,', llista.length, 'frases');
