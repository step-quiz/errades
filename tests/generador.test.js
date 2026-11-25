// tests/generador.test.js — el generador d'exemples (docs/SPEC.md §5.3 i §10).
import fs from 'node:fs';
import { generaExemple, valida, perPagina, solucio, equivalents, aplica, resol, REGLES, Q } from '../js/equacions/generador.js';
import { ok, igual, informe } from './lib.js';

const TIPUS = JSON.parse(fs.readFileSync(new URL('../data/errors.json', import.meta.url), 'utf8'));
const LIMITS = { 1: [4, 5], 2: [6, 8] };

// Racionals i procediment
igual([new Q(6, -4).n, new Q(6, -4).d], [-3, 2], 'Q simplifica i porta el signe al numerador');
const l = { L: [{ k: 'p', c: 2, b: 4 }], R: [{ k: 'n', v: new Q(13) }, { k: 'x', c: new Q(-7) }] };
ok(solucio(l).igual(new Q(5, 9)), '2·(x + 4) = 13 − 7x té solució 5/9');
igual(resol(l).map(p => p.op), ['exp', 'tra', 'red2', 'div'], 'procediment de 2·(x + 4) = 13 − 7x');
ok(aplica('simp', resol(l)[3].linia) === null, '5/9 ja no se simplifica');

// Molts exemples per nivell: tots vàlids, dins dels marges, deterministes
const SEEDS = 1500;
for (const nivell of [1, 2]) {
    for (const errades of [1, 0]) {
        const vistos = {};
        const n = errades ? SEEDS : 300;
        for (let s = 1; s <= n; s++) {
            let ex;
            try {
                ex = generaExemple({ llavor: s, nivell, errades }, TIPUS);
            } catch (e) {
                ok(false, `nivell ${nivell}, ${errades} errades, llavor ${s}: ${e.message}`);
                continue;
            }
            const p = valida(ex);
            ok(p.length === 0, `nivell ${nivell}, llavor ${s}: ${p.join('; ')}`);
            const [mn, mx] = LIMITS[nivell];
            ok(ex.linies.length >= mn && ex.linies.length <= mx, `nivell ${nivell}, llavor ${s}: ${ex.linies.length} línies`);
            ok(Object.keys(ex.errades).length === errades, `nivell ${nivell}, llavor ${s}: hauria de tenir ${errades} errades`);
            for (const e of Object.values(ex.errades)) vistos[e.tipus] = (vistos[e.tipus] || 0) + 1;
            if (s <= 50) igual(perPagina(generaExemple({ llavor: s, nivell, errades }, TIPUS)), perPagina(ex), `llavor ${s}: la mateixa llavor ha de donar el mateix exemple`);
        }
        if (errades) {
            const esperats = nivell === 1
                ? ['SIGNE_TRANSPOSAR', 'TERMES_NO_SEMBLANTS', 'CALCUL', 'OPERACIO_INVERSA', 'DIVISIO_SIGNE', 'QUOCIENT_INVERTIT']
                : Object.keys(REGLES);
            for (const t of esperats) ok(vistos[t] > 0, `nivell ${nivell}: no surt mai el tipus ${t}`);
            console.log(`  nivell ${nivell}: ${JSON.stringify(vistos)}`);
        }
    }
}
// Varietat: llavors diferents → enunciats diferents
const enunciats = new Set();
for (let s = 1; s <= 200; s++) enunciats.add(generaExemple({ llavor: s, nivell: 1 }, TIPUS).linies[0].join(' '));
ok(enunciats.size > 180, `poca varietat d'enunciats: ${enunciats.size} de 200`);

// Etapa 2 (el generador ja ho sap fer): dues errades i errades compensades
for (let s = 1; s <= 150; s++) {
    const ex = generaExemple({ llavor: s, nivell: 2, errades: 2 }, TIPUS);
    ok(valida(ex).length === 0 && Object.keys(ex.errades).length === 2, `dues errades, llavor ${s}`);
    const c = generaExemple({ llavor: s, nivell: 2, errades: 2, compensades: true }, TIPUS);
    const ls = c._linies;
    ok(valida(c).length === 0 && solucio(ls[ls.length - 1]).igual(solucio(ls[0])) && c.nota, `compensades, llavor ${s}`);
    ok(!equivalents(ls[0], ls[1]) || !c.errades[1], 'una errada no es dedueix de l\'anterior');
}

// Coherència dels textos: cada línia bona té el seu «per què»; les errades, tots els textos
const ex = generaExemple({ llavor: 42, nivell: 2 }, TIPUS);
for (let i = 1; i < ex.linies.length; i++) ok(ex.errades[i] || /^Aquesta línia és correcta/.test(ex.correctes[i]), `text de la línia ${i + 1}`);
informe('generador');
