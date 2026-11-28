// tests/banc.test.js — els exemples revisats de data/banc.json estan ben formats.
import fs from 'node:fs';
import { encaixaBanc } from '../js/equacions/nivells.js';
import { DESACTIVADES } from '../js/equacions/generador.js';
import { escrivible, valorFitxa } from '../js/motor/escriure.js';
import { ok, informe } from './lib.js';

const banc = JSON.parse(fs.readFileSync(new URL('../data/banc.json', import.meta.url), 'utf8')).exemples;
const tipus = Object.keys(JSON.parse(fs.readFileSync(new URL('../data/errors.json', import.meta.url), 'utf8')));
ok(Array.isArray(banc), 'data/banc.json té una llista «exemples»');
const ids = new Set();
for (const ex of banc) {
    const id = ex.banc || '?';
    ok(!ids.has(id), `${id}: identificador repetit`);
    ids.add(id);
    ok(ex.linies.every(l => l.filter(t => t === '=').length === 1), `${id}: cada línia ha de tenir un «=»`);
    const errs = Object.keys(ex.errades).map(Number);
    ok(!errs.includes(0), `${id}: l'enunciat no pot ser una errada`);
    for (let i = 1; i < ex.linies.length; i++)
        if (!errs.includes(i)) ok(/^Aquesta línia és correcta, perquè\n/.test(ex.correctes[i] || ''), `${id}: falta el text de la línia ${i}`);
    for (const [j, e] of Object.entries(ex.errades)) {
        ok(tipus.includes(e.tipus), `${id}: tipus desconegut ${e.tipus}`);
        ok(e.perque.length === 4 && e.perque.filter(o => o[1]).length === 1, `${id}: «Per què?» amb 4 frases i una de certa`);
        ok(e.opcions.length === 3 && e.opcions.filter(o => o[1]).length === 1 && e.opcions.find(o => o[1])[0] === e.bona, `${id}: «Corregeix-la» amb la bona entre 3`);
        ok(e.terme >= 0 && ex.linies[j][e.terme] !== '=', `${id}: terme equivocat fora de lloc`);
        ok(Array.isArray(e.fitxesBona), `${id}: falten les fitxes de la línia bona`);
        if (escrivible(e, ex.linies[j])) ok(valorFitxa(e.fitxesBona[e.terme]) !== null, `${id}: el terme bo no es pot llegir`);
        ok(!e.expl.includes(e.bona), `${id}: l'explicació no pot dir la línia bona`);
    }
    // els exemples d'una regla desactivada (enquesta, 28/11/2026) no surten a cap nivell; els altres, almenys a un
    const desactivat = Object.values(ex.errades).some(e => DESACTIVADES.includes(e.tipus));
    ok([1, 2, 3, 4, 5].some(n => encaixaBanc(ex, n, true)) !== desactivat, `${id}: ${desactivat ? 'és d\'una regla desactivada i encara surt' : 'no encaixa amb cap nivell'}`);
}
ok(!/undefined|NaN/.test(JSON.stringify(banc)), 'cap text amb undefined o NaN');
console.log(`  ${banc.length} exemples al banc`);
informe('banc');
