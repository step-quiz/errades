// tests/prioritat.test.js — el generador de prioritat d'operacions (js/prioritat/generador.js).
import { generaExemple, valida, perPagina, valor, pas, resol, text, fitxes, REGLES, T, creaAtzar, versemblant } from '../js/prioritat/generador.js';
import { exempleSessio } from '../js/prioritat/pagina.js';
import { escrivible, valorFitxa } from '../js/motor/escriure.js';
import { ok, igual, informe } from './lib.js';

const { N, Pa, W, it } = T;
const E = (...items) => items.map(([o, x]) => it(o, typeof x === 'number' ? N(x) : x));

// Valor i procediment
igual(valor(E([null, 3], ['+', 4], ['·', 2])), 11, '3 + 4 · 2 = 11');
igual(valor(E([null, 24], [':', 2], ['·', 3])), 36, '24 : 2 · 3 = 36 (d\'esquerra a dreta)');
igual(valor(E([null, 2], ['·', Pa(E([null, 11], ['−', 1]))])), 20, '2 · (11 − 1) = 20');
igual(valor(E([null, 7], ['−', W(3, 2)])), -2, '7 − 3^2 = −2');
igual(valor(E([null, 7], [':', 2])), null, 'divisió no exacta → null');
const ex1 = E([null, 3], ['+', 4], ['·', 2], ['−', 6], [':', 3]);
igual(resol(ex1).map(p => text(p.E)), ['3 + 8 − 2', '11 − 2', '9'], 'procediment: les cadenes alhora, després d\'esquerra a dreta');
igual(resol(E([null, 2], ['·', Pa(E([null, 3], ['+', 4], ['·', 2]))])).map(p => text(p.E)), ['2 · (3 + 8)', '2 · 11', '22'], 'procediment: dins del parèntesi, i el parèntesi desapareix');
igual(fitxes(ex1, true), ['3', '+ 4', '· 2', '− 6', ': 3'], "les fitxes de l'enunciat, sense «=»");
igual(fitxes(E([null, 5], ['·', -3])), ['=', '5', '· (−3)'], 'un nombre negatiu darrere d\'una operació va entre parèntesis');

// Cada regla, amb un exemple fix (els de les fonts quan n'hi ha)
const fa = (id, e) => {
    const res = REGLES[id].fes(e, creaAtzar(1));
    return res ? text(res.E) : null;
};
igual(fa('ESQUERRA_DRETA', E([null, 6], ['+', 5], ['·', 2])), '11 · 2', 'ESQUERRA_DRETA: 6 + 5 · 2 → 11 · 2 (Tabak, 2019)');
igual(fa('ESQUERRA_DRETA', E([null, 6], ['·', 5], ['+', 2])), null, 'ESQUERRA_DRETA: no si la multiplicació ja és la primera');
igual(fa('SUMA_ABANS_RESTA', E([null, 10], ['−', 3], ['+', 2])), '10 − 5', 'SUMA_ABANS_RESTA: 10 − 3 + 2 → 10 − 5');
igual(fa('PRODUCTE_ABANS_DIVISIO', E([null, 24], [':', 2], ['·', 3])), '24 : 6', 'PRODUCTE_ABANS_DIVISIO: 24 : 2 · 3 → 24 : 6');
igual(fa('PARENTESI_IGNORAT', E([null, 2], ['·', Pa(E([null, 11], ['−', 1]))], ['−', 4])), '22 − 1 − 4', 'PARENTESI_IGNORAT: 2 · (11 − 1) → 22 − 1');
igual(fa('POTENCIA_PER_EXPONENT', E([null, 7], ['+', W(3, 2)])), '7 + 6', 'POTENCIA_PER_EXPONENT: 3^2 → 6');
igual(fa('POTENCIA_PER_EXPONENT', E([null, 7], ['+', W(2, 2)])), null, 'POTENCIA_PER_EXPONENT: 2^2 = 2 · 2, no és cap errada');
igual(fa('POTENCIA_DESPRES', E([null, 1], ['+', 2], ['·', W(3, 2)])), '1 + 6^2', 'POTENCIA_DESPRES: 2 · 3^2 → 6^2');
igual(fa('RESTA_NEGATIVA', E([null, 15], ['−', 27])), '12', 'RESTA_NEGATIVA: 15 − 27 → 12');
igual(fa('RESTA_NEGATIVA', E([null, -24], ['−', 5])), null, 'RESTA_NEGATIVA: no amb un primer nombre negatiu');
igual(fa('SIGNE_PRODUCTE', E([null, 7], ['−', -8], ['·', 8])), '7 − 64', 'SIGNE_PRODUCTE: (−8) · 8 → 64');

// Molts exemples de cada nivell: vàlids, deterministes, amb el nombre d'errades del nivell i totes les regles
const vistos = { 1: {}, 2: {} };
const LIMITS = { 1: [4, 6], 2: [5, 8] };
for (const nivell of [1, 2])
    for (const errades of nivell === 1 ? [0, 1] : [0, 1, 2]) // 2 errades només a la forma 2 (nivells 4 i 5)
        for (let s = 1; s <= 220; s++) {
            let ex;
            try {
                ex = generaExemple({ llavor: s, nivell, errades });
            } catch (e) {
                ok(false, `nivell ${nivell}, ${errades} errades, llavor ${s}: ${e.message}`);
                continue;
            }
            const p = valida(ex);
            ok(p.length === 0, `nivell ${nivell}, llavor ${s}: ${p.join('; ')}`);
            ok(Object.keys(ex.errades).length === errades, `nivell ${nivell}, llavor ${s}: ${errades} errades`);
            const [mn, mx0] = LIMITS[nivell];
            const mx = mx0 + (errades === 2 ? 1 : 0);
            ok(ex.linies.length >= mn && ex.linies.length <= mx, `nivell ${nivell}, llavor ${s}: ${ex.linies.length} línies`);
            if (nivell === 1) ok(!ex.linies.some(l => l.some(t => /[(^−]\d|\(|\^/.test(t) && !/^− \d+$/.test(t))), `nivell 1, llavor ${s}: sense parèntesis, potències ni negatius`);
            if (s <= 30) igual(perPagina(generaExemple({ llavor: s, nivell, errades })), perPagina(ex), `llavor ${s}: determinista`);
            for (const [j, e] of Object.entries(ex.errades)) {
                vistos[nivell][e.tipus] = (vistos[nivell][e.tipus] || 0) + 1;
                ok(e.perque.every(o => /^[A-ZÀ-Ú$]/.test(o[0]) && o[0].endsWith('.')), `llavor ${s}: frases amb majúscula i punt`);
                if (escrivible(e, ex.linies[j])) ok(valorFitxa(e.fitxesBona[e.terme]) !== null, `llavor ${s}: terme per escriure llegible`);
            }
        }
for (const t of ['ESQUERRA_DRETA', 'SUMA_ABANS_RESTA', 'PRODUCTE_ABANS_DIVISIO']) ok(vistos[1][t] > 0, `nivell 1: no surt mai ${t}`);
for (const t of Object.keys(REGLES)) ok(vistos[2][t] > 0, `nivell 2: no surt mai ${t}`);
console.log(`  nivell 1: ${JSON.stringify(vistos[1])}\n  nivell 2: ${JSON.stringify(vistos[2])}`);

// Compensades i sessions de tots els nivells
let comp = 0;
for (let s = 1; s <= 60; s++) {
    try {
        const c = generaExemple({ llavor: s, nivell: 2, errades: 2, compensades: true });
        ok(valida(c).length === 0 && c.nota, `compensades, llavor ${s}`);
        comp++;
    } catch (e) {
        /* n'hi pot haver que no en tinguin */
    }
}
ok(comp >= 10, `poques compensades possibles: ${comp} de 60`);
for (const nivell of [1, 2, 3, 4, 5])
    for (const noerrors of [false, true])
        for (let i = 0; i < 25; i++) {
            const ex = exempleSessio(i, { base: 500 * nivell, nivell, noerrors });
            ok(ex.activitat === 'prioritat' && ex.linies[1][0] === '=', `sessió nivell ${nivell}, exemple ${i}`);
        }
// Versemblança (el David, 26/11/2026, C1–C5): qui ja ha fet bé (2 + 3 · 4) no fa després 14 + 5 · 2 → 19 · 2
{
    const { N, Pa, it } = T;
    const E0 = [it(null, Pa([it(null, N(2)), it('+', N(3)), it('·', N(4))])), it('+', N(5)), it('·', N(2))];
    const ls = [E0, ...resol(E0).map(p => p.E)];
    igual(text(ls[2]), '14 + 5 · 2', 'versemblança: el pas abans del parany');
    igual([versemblant('ESQUERRA_DRETA', ls, 3), versemblant('PARENTESI_IGNORAT', ls, 3)], [false, true], "versemblança: ESQUERRA_DRETA filtrada, PARENTESI_IGNORAT no (C6)");
    const E1 = [it(null, N(6)), it('+', N(5)), it('·', N(2))];
    ok(versemblant('ESQUERRA_DRETA', [E1, E1], 1), 'versemblança: sense cap pas anterior, la regla es pot aplicar');
}

// POTENCIA_PER_EXPONENT amb un 2^2 al davant (2·2 = 2²: no és a la llista): s'ha d'espatllar el 4^2, no el 2^2
{
    const { N, W, it } = T;
    const E = [it(null, W(2, 2)), it('+', W(4, 2)), it('+', N(1))];
    const res = REGLES.POTENCIA_PER_EXPONENT.fes(E, creaAtzar(1));
    igual(res && text(res.E), '4 + 8 + 1', 'POTENCIA_PER_EXPONENT: 2^2 + 4^2 + 1 → 4 + 8 + 1 (el 2^2 surt igual)');
    const E2 = [it(null, N(9)), it('−', N(2)), it('·', W(3, 2)), it('+', W(5, 2))];
    const r2 = REGLES.POTENCIA_PER_EXPONENT.fes(E2, creaAtzar(1));
    igual(r2 && text(r2.E), '9 − 2 · 6 + 10', 'POTENCIA_PER_EXPONENT: totes les potències del pas malament (9 − 2·3² + 5² → 9 − 2·6 + 10)');
    ok(/3\^2\$ i \$5\^2/.test(REGLES.POTENCIA_PER_EXPONENT.expl(r2.dades)), "POTENCIA_PER_EXPONENT: l'explicació parla de les dues");
}

informe('prioritat');
