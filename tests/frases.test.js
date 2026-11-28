// tests/frases.test.js — les frases de «Per què?» de l'editor del David (js/equacions/frases.js).
import fs from 'node:fs';
import { render, posaParaula, formaMembre, exempleAmbParaula, oposat, DIAGNOSI } from '../js/equacions/frases.js';
import { FRASES } from '../js/equacions/frases-dades.js';
import { generaExemple, REGLES, T, aplica, fitxes, frasesErrada } from '../js/equacions/generador.js';
import { ok, igual, informe } from './lib.js';
const TIPUS = JSON.parse(fs.readFileSync(new URL('../data/errors.json', import.meta.url), 'utf8'));

// ---- El llenguatge de plantilles ----
igual(render('El $[c]$ per [x].', { c: '4', x: 'x' }), 'El $4$ per $x$.', 'un valor fora de $…$ es posa en fórmula');
igual(render('[Els termes] han canviat.', { 'Els termes': 'El $−1$ i el $+x$' }), 'El $−1$ i el $+x$ han canviat.', 'un valor que ja porta $ es posa tal qual');
igual(render('Ha fet ${[B]|[A]}$.', { A: '3', B: '−12' }), 'Ha fet ${−12|3}$.', 'fracció');
igual(render('El -[x] i -3.', { x: 'x' }), 'El −$x$ i −3.', 'el guionet davant d\'una xifra o d\'un valor és un menys');
igual(render("Hauria d'haver restat $[B]$ - $[A]$.", { A: '−14', B: '42' }), "Hauria d'haver restat $42$ − $(−14)$.", 'un negatiu després d\'un operador va entre parèntesis');
igual(render('Resta $[B] - [A]$.', { A: '+3', B: '7' }), 'Resta $7 − 3$.', 'un + després d\'un operador no s\'escriu');
igual(render('Càlcul: $[c]$.', { c: '−8' }), 'Càlcul: $−8$.', 'els dos punts no són cap operador');
igual(render('El \\oposite{[a]}, el \\signe{[b]} i el \\nosign{[c]}.', { a: '−1', b: '3', c: '−23' }), 'El $+1$, el $+3$ i el $23$.', 'macros fora de fórmula');
igual(render('Un $\\bold{\\oposite{[b]}}$.', { b: '3' }), 'Un $**−3**$.', 'negreta i oposat dins d\'una fórmula');
igual(render('Ha \\bold{oblidat} el \\bold{$[x]$ sencer}.', { x: '3x' }), 'Ha **oblidat** el $**3x**$** sencer**.', 'la negreta no travessa cap $');
igual(render('Caldria \\bold{tots } els termes.', {}), 'Caldria **tots** els termes.', "l'espai de dins de la negreta queda fora");
igual(render('El $[a]$ i el $[b]$.', { a: '1' }), null, 'si falta un valor, la frase no surt');
igual(render('[al membre] [costat]', { costat: "de l'esquerra" }), "[al membre] de l'esquerra", '[costat] és text; els de «membre» es deixen');
igual(oposat('−9x + 10'), '9x − 10', "l'oposat de dos termes");

// ---- La paraula «membre» ----
igual(posaParaula("[Al membre] [costat]; [l'altre membre]; [els dos membres]; [del membre]", 'membre'), "Al membre [costat]; l'altre membre; els dos membres; del membre", 'membre (masculí)');
igual(posaParaula("[al membre]; [l'altre membre]; [els dos membres]; [el seu membre]; [membres]", 'banda'), "a la banda; l'altra banda; les dues bandes; la seva banda; bandes", 'banda (femení)');
igual(formaMembre('al seu membre', 'part'), 'a la seva part', 'part (femení)');
igual(formaMembre('el membre', 'costat'), 'el costat', 'costat (masculí)');
igual(posaParaula('[al membre]', 'xyz'), 'al membre', 'una paraula desconeguda és «membre»');
const ex0 = { errades: { 2: { perque: [['El $+3$ ha canviat de [membre].', true]] } } };
igual(exempleAmbParaula(ex0, 'costat').errades[2].perque[0][0], 'El $+3$ ha canviat de costat.', 'exempleAmbParaula');
igual(ex0.errades[2].perque[0][0], 'El $+3$ ha canviat de [membre].', "exempleAmbParaula no toca l'original");

// ---- Les dades: totes les frases de cada situació existeixen ----
for (const [sid, s] of Object.entries(FRASES.situacions))
    for (const id of [s.bona, ...s.dolentes.map(d => d.id), ...(s.reserva || [])]) ok(typeof FRASES.frases[id] === 'string', `${sid}: falta la frase ${id}`);

// ---- Molts exemples: cada «Per què?» té 4 frases diferents i cap marcador sense resoldre ----
DIAGNOSI.actiu = true;
for (const nivell of [1, 2, 3, 4, 5]) for (const errades of [1, 2]) for (let s = 1; s <= 150; s++) generaExemple({ llavor: s, nivell, errades }, TIPUS);
const vistes = {};
for (const v of DIAGNOSI.vistes) {
    vistes[v.sid] = (vistes[v.sid] || 0) + 1;
    for (const t of [v.bona, ...v.dolentes]) {
        const fet = posaParaula(t, 'banda');
        ok(!/[[\]\\]|undefined|null|NaN|\u0003|\u0004/.test(fet), `${v.sid}: queda alguna cosa sense resoldre: ${fet}`);
        ok((fet.split('$').length - 1) % 2 === 0, `${v.sid}: un $ sense tancar: ${fet}`);
        ok((fet.split('**').length - 1) % 2 === 0, `${v.sid}: una negreta sense tancar: ${fet}`);
    }
}
DIAGNOSI.actiu = false;
for (const sid of ['DIST', 'DSIG2', 'ST1', 'ST2', 'SC1', 'SC2', 'TNS1', 'TNS2', 'CU', 'CAL1', 'CAL2', 'CAL3', 'OI1', 'OI3', 'OI4', 'CO', 'DS', 'QI'])
    ok(vistes[sid] > 0, `el generador fa servir la situació ${sid}`);

// ---- Situacions rares, fetes a mà ----
const { X, N, P, linia } = T;
const amb = (id, l, op, r = () => 0.1) => {
    const res = REGLES[id].fes(l, r, op);
    const bona = aplica(op, l);
    const malF = fitxes(res.linia),
        bonaF = fitxes(bona);
    const terme = malF.findIndex((t, i) => t !== '=' && t !== bonaF[i]);
    return frasesErrada(id, res.dades, { op, abans: l, malF, bonaF, terme });
};
// DSIG1: 5x − (x + 3) = 9 → 5x − x + 3 = 9
const d1 = amb('DIST_SIGNE', linia([X(5), P(-1, 3)], [N(9)]), 'exp');
igual(d1.sid, 'DSIG1', '−(x + 3) és la situació DSIG1');
ok(d1.bona.includes('$+3$') && d1.bona.includes('$**−3**$'), `DSIG1, frase bona: ${d1.bona}`);
ok(d1.dolentes.length >= 3, `DSIG1: tres distractors (${d1.dolentes.length})`);
ok(d1.dolentes.some(t => t.includes('$5x$')), 'DSIG1: el terme de davant del parèntesi');
// DSIG1 sense terme davant: −(x + 3) = 9 → el distractor del terme d'abans no surt, i n'hi ha prou amb la reserva
const d1b = amb('DIST_SIGNE', linia([P(-1, 3)], [N(9)]), 'exp');
ok(d1b.dolentes.length >= 3 && !d1b.dolentes.some(t => t.includes("encara hi ha")), `DSIG1 sense terme d'abans: ${d1b.dolentes.join(' | ')}`);

// ---- El banc: les frases desades tampoc no tenen res per resoldre (fora de «membre») ----
const banc = JSON.parse(fs.readFileSync(new URL('../data/banc.json', import.meta.url), 'utf8')).exemples;
for (const ex of banc)
    for (const e of Object.values(ex.errades))
        for (const [t] of e.perque) ok(!/[[\]\\]|undefined|null/.test(posaParaula(t)), `${ex.banc}: ${t}`);

informe('frases');
