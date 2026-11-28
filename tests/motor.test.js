// tests/motor.test.js — les peces comunes del motor (auditoria 2: C1, C2, C3, C4, P12).
import { ok, informe } from './lib.js';
import { esc, menys, llista } from '../js/motor/util.js';
import { NIVELLS, capcalera } from '../js/motor/nivells.js';
import { termesEquivocats, triaPonderada, frasaCorrecta, notaCompensades, problemesErrada } from '../js/motor/exemple.js';
import { llavorExercici } from '../js/motor/activitat.js';
import { creaAtzar } from '../js/motor/atzar.js';

// util
ok(esc(`<a href="x">l'u & d</a>`) === '&lt;a href=&quot;x&quot;&gt;l&#39;u &amp; d&lt;/a&gt;', 'esc');
ok(menys(-3) === '−3' && menys(4) === '4' && menys(0) === '0', 'menys');
ok(llista(['a', 'b', 'c']) === 'a, b i c' && llista(['a']) === 'a' && llista([], 'res') === 'res', 'llista «a, b i c»');

// C2 i P12: una sola taula; la capçalera
for (const act of ['equacions', 'prioritat']) for (let n = 1; n <= 5; n++) ok(NIVELLS[act][n] && NIVELLS[act][n].index && NIVELLS[act][n].errades, `etiquetes ${act} ${n}`);
ok(!JSON.stringify(NIVELLS).includes('advertir'), "cap etiqueta diu «sense advertir-ho» (el David: «sense dir-ho»)");
ok(capcalera('equacions', 1, false) === 'Nivell 1 · una errada, sense parèntesis', 'capçalera nivell 1');
ok(capcalera('equacions', 4, false) === 'Nivell 4 · dues errades', 'capçalera nivell 4');
ok(capcalera('equacions', 1, true) === 'Nivell 1 · sense parèntesis · pot ser que no hi hagi cap errada', 'P12: amb noerrors no es diu quantes errades hi ha');
ok(capcalera('equacions', 4, true) === 'Nivell 4 · pot ser que no hi hagi cap errada', 'P12: nivell 4 amb noerrors');
ok(capcalera('prioritat', 2, false) === 'Nivell 2 · una errada, amb parèntesis o potències', 'capçalera prioritat 2');
for (const act of ['equacions', 'prioritat']) for (let n = 1; n <= 5; n++) ok(!/errades?,|una errada ·|dues errades ·/.test(capcalera(act, n, true)), `P12: ${act} ${n} amb noerrors no compta errades`);

// C3: la bastida comuna
const t = termesEquivocats(['=', '2', '+', '5'], ['=', '2', '+', '3']);
ok(t.terme === 3 && t.termes.length === 1 && t.termes[0] === 3, 'termesEquivocats: un terme');
ok(termesEquivocats(['a', '=', 'b'], ['c', '=', 'd'], [2]).terme === 2, 'termesEquivocats: la marca mana');
const r = creaAtzar(7);
const compta = { a: 0, b: 0 };
for (let i = 0; i < 3000; i++) compta[triaPonderada(r, [{ id: 'a' }, { id: 'b' }], c => (c.id === 'a' ? 3 : 1)).id]++;
ok(compta.a > 2 * compta.b, `triaPonderada respecta els pesos (${compta.a}/${compta.b})`);
ok(frasaCorrecta(['$2$', '$3$']) === 'Aquesta línia és correcta, perquè és correcte haver escrit $2$ i també és correcte haver escrit $3$.', 'frasaCorrecta');
ok(frasaCorrecta([]) === 'Aquesta línia és correcta, perquè tot és correcte.', 'frasaCorrecta sense res');
ok(/^El resultat \$7\$ és correcte, .* el càlcul és incorrecte, encara que doni el resultat correcte per casualitat\.$/.test(notaCompensades(7, { art: 'el resultat', adj: 'correcte' }, { art: 'el càlcul', adj: 'incorrecte' })), 'notaCompensades');
ok(problemesErrada(1, { perque: [['a', true], ['b', false], ['c', false]], opcions: [['x', true], ['y', false], ['z', false]], bona: 'x' }).length === 0, 'problemesErrada: bo');
ok(problemesErrada(1, { perque: [['a', true], ['a', false], ['c', false]], opcions: [['x', true], ['y', false]], bona: 'y' }).length === 4, 'problemesErrada: quatre problemes');

// C1
ok(llavorExercici(5, 2) === 5 + 2 * 7919 && llavorExercici(4294967295, 1) === (4294967295 + 7919) >>> 0, 'llavorExercici');

informe('motor');
