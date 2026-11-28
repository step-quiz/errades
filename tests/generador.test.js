// tests/generador.test.js — el generador d'exemples (docs/SPEC.md §5.3 i §10).
import fs from 'node:fs';
import { posaParaula } from '../js/equacions/frases.js';
import { DESACTIVADES } from '../js/equacions/generador.js';
import { generaExemple, valida, perPagina, solucio, equivalents, aplica, resol, REGLES, Q, T, text, creaAtzar, jaDistingeix, versemblant } from '../js/equacions/generador.js';
import { ok, igual, informe } from './lib.js';

const TIPUS = JSON.parse(fs.readFileSync(new URL('../data/errors.json', import.meta.url), 'utf8'));
const LIMITS = { 1: [4, 6], 2: [6, 8] };

// Racionals i procediment
igual([new Q(6, -4).n, new Q(6, -4).d], [-3, 2], 'Q simplifica i porta el signe al numerador');
const l = { L: [T.P(2, 4)], R: [{ k: 'n', v: new Q(13) }, { k: 'x', c: new Q(-7) }] };
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
            ok(!/[+−] 0(?![\d|])/.test(ex.linies[0].join(' ')), `nivell ${nivell}, llavor ${s}: l'enunciat té un «+ 0»: ${ex.linies[0].join(' ')}`);
            for (const e of Object.values(ex.errades)) vistos[e.tipus] = (vistos[e.tipus] || 0) + 1;
            if (s <= 50) igual(perPagina(generaExemple({ llavor: s, nivell, errades }, TIPUS)), perPagina(ex), `llavor ${s}: la mateixa llavor ha de donar el mateix exemple`);
        }
        if (errades) {
            const esperats = nivell === 1
                ? ['SIGNE_TRANSPOSAR', 'SIGNE_COPIAT', 'TERMES_NO_SEMBLANTS', 'COEFICIENT_U', 'CALCUL', 'OPERACIO_INVERSA', 'DIVISIO_SIGNE', 'QUOCIENT_INVERTIT', 'INVERS_X']
                : Object.keys(REGLES).filter(t => t !== 'INVERS_X' && !DESACTIVADES.includes(t)); // a/x + c = d és de nivell 1
            for (const t of esperats) ok(vistos[t] > 0, `nivell ${nivell}: no surt mai el tipus ${t}`);
            // les regles desactivades (enquesta, 28/11/2026) no surten mai
            for (const t of DESACTIVADES) ok(!vistos[t], `nivell ${nivell}: surt la regla desactivada ${t}`);
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
for (let i = 1; i < ex.linies.length; i++) ok(ex.errades[i] || /^Aquesta línia és correcta, perquè\nés correcte haver escrit \$/.test(ex.correctes[i]), `text de la línia ${i}: ${ex.correctes[i]}`);
// «Per què?»: 3 frases concretes (la bona i 2 distractors; el David, 28/11/2026), cap de genèrica repetida de data/errors.json, i cap explicació amb la resposta
for (let s = 1; s <= 300; s++)
    for (const nivell of [1, 2]) {
        const e = generaExemple({ llavor: s, nivell }, TIPUS);
        for (const v of Object.values(e.errades)) {
            ok(v.perque.length === 3 && v.perque.filter(o => o[1]).length === 1, `llavor ${s}: «Per què?» amb 3 frases i una de certa`);
            // (una frase pot començar amb una fórmula: «$+3$ i $−12$ tenen…»)
            ok(v.perque.every(o => /^[A-ZÀ-Ú$]/.test(posaParaula(o[0])) && o[0].endsWith('.')), `llavor ${s}: frases amb majúscula i punt`);
        }
    }
// Regles afegides després del lot 1 del banc (comentaris del David a B05, B07, B15 i B16)
const { X: tX, N: tN, linia: tL } = T;
function resultats(id, l, op, n = 200) {
    const out = new Set();
    for (let s = 1; s <= n; s++) {
        const res = REGLES[id].fes(l, creaAtzar(s), op);
        out.add(res ? text(res.linia) : null);
    }
    return [...out].sort();
}
igual(resultats('CALCUL', tL([tX(12)], [tN(-3), tN(15)]), 'red2'), ['12x = −12', '12x = −18'], 'CALCUL: −3 + 15 → −12 o −18 (B07)');
igual(resultats('CALCUL', tL([tX(12)], [tN(-3), tN(-15)]), 'red2'), ['12x = 18', '12x = −12'], 'CALCUL: −3 − 15 → +18 o −12');
igual(resultats('CALCUL', tL([tX(8), tX(4)], [tN(3), tN(15)]), 'red2'), [null], 'CALCUL: sense cap terme negatiu no hi ha errada de càlcul');
igual(resultats('SIGNE_COPIAT', tL([tX(9), tN(7)], [tX(3), tN(-23)]), 'tra'), ['9x − 3x = 23 − 7'], 'SIGNE_COPIAT: el −23 es copia amb el signe canviat (B05)');
{
    const rs = resultats('SIGNE_COPIAT', tL([tX(2), tN(-8), tX(-5)], [tX(-7), tN(-36)]), 'red1');
    for (const t of ['−3x + 8 = −7x − 36', '−3x − 8 = 7x − 36', '−3x − 8 = −7x + 36', '−3x + 8 = −7x + 36'])
        ok(rs.includes(t), `SIGNE_COPIAT (B15): falta ${t}`);
    ok(rs.length <= 6, 'SIGNE_COPIAT (B15): un o dos signes, i res més');
}
igual(resultats('SIGNE_TRANSPOSAR', tL([tX(5), tN(3)], [tX(2), tN(9)]), 'tra').includes('5x + 2x = 9 + 3'), true, 'SIGNE_TRANSPOSAR amb els dos termes (Erbaş YK26)');
igual(resultats('COEFICIENT_OBLIDAT', tL([tX(3)], [tN(12)]), 'div'), ['x = 12'], 'COEFICIENT_OBLIDAT: 3x = 12 → x = 12');
igual(resultats('OPERACIO_INVERSA', tL([tX(3)], [tN(12)]), 'div', 400).sort(), ['x = 15', 'x = 36', 'x = 9', 'x = −9'].sort(), 'OPERACIO_INVERSA: resta, resta al revés, producte i suma');
igual(resultats('SIGNE_COPIAT', tL([tX(4)], [tN(9), tN(3)]), 'red2'), [null], 'SIGNE_COPIAT: no s\'aplica a red2');
igual(resultats('TERMES_NO_SEMBLANTS', tL([tX(2), tN(3), tX(4)], [tN(18)]), 'red1'), ['9x = 18'], 'TERMES_NO_SEMBLANTS amb tres termes: 2x + 3 + 4x = 18 → 9x = 18 (B16)');
igual(resultats('TERMES_NO_SEMBLANTS', tL([tX(6), tN(-48), tX(5)], [tN(1)]), 'red1'), [null], 'TERMES_NO_SEMBLANTS amb tres termes: no amb nombres grans');
// Regles de les errades reals del David (lot 2)
igual(text(tL([tX(1), T.P(-2, 6, 3)], [tX(3), tN(7)])), 'x − 2·(3x + 6) = 3x + 7', 'parèntesi amb un coeficient a dins');
igual(resultats('DIST_SUMA', tL([tX(1), T.P(-2, 6, 3)], [tX(3), tN(7)]), 'exp'), ['x − 5x − 12 = 3x + 7'], 'DIST_SUMA: −2·(3x + 6) → −5x − 12');
igual(resultats('DIST_SUMA', tL([T.P(2, 1)], [tN(8)]), 'exp'), [null], 'DIST_SUMA: no sense coeficient a dins');
igual(resultats('COEFICIENT_U', tL([tX(3), tX(1), tX(6)], [tN(4), tX(-2)]), 'red1'), ['9x = 4 − 2x'], 'COEFICIENT_U: 3x + x + 6x → 9x');
igual(resultats('COEFICIENT_U', tL([tX(5), tX(-1)], [tN(9), tN(-1)]), 'red2'), ['5x = 8'], 'COEFICIENT_U: 5x − x → 5x');
igual(resultats('COEFICIENT_U', tL([tX(5), tX(2)], [tN(9)]), 'red2'), [null], 'COEFICIENT_U: sense cap x sola no hi ha errada');
igual(aplica('exp', tL([tX(1), T.P(-2, 6, 3)], [tX(3), tN(7)])) && text(aplica('exp', tL([tX(1), T.P(-2, 6, 3)], [tX(3), tN(7)]))), 'x − 6x − 12 = 3x + 7', 'exp amb coeficient a dins');

// Eina del banc: un enunciat fix i un filtre de candidats
{
    let fet = null;
    for (let s = 1; s <= 200 && !fet; s++)
        try {
            fet = generaExemple({ llavor: s, nivell: 1, e0: tL([tX(8), tN(-15)], [tX(-4), tN(-3)]), filtre: c => c.id === 'CALCUL' && text(c.res.linia) === '12x = −18' }, TIPUS);
        } catch (e) {
            /* una altra llavor */
        }
    ok(fet && fet.linies[0].join(' ') === '8x − 15 = −4x − 3' && fet.linies[2].join(' ') === '12x = −18' && valida(fet).length === 0, 'eina del banc: B07 refet amb −18');
}

// Versemblança (el David, 26/11/2026): qui ja ha agrupat bé 15 − 4x + 8 → 23 − 4x no suma després 23 − 4x → 19x
{
    const ls = [tL([tN(15), tX(-4), tN(8)], [tX(2), tN(5)]), tL([tN(23), tX(-4)], [tX(2), tN(5)]), tL([tN(23), tX(-4)], [tX(2), tN(5)])];
    igual([jaDistingeix(ls, 1), jaDistingeix(ls, 2)], [false, true], 'jaDistingeix: després de 15 − 4x + 8 → 23 − 4x');
    let n = 0, mal = 0;
    for (const nivell of [1, 2])
        for (const err of [1, 2])
            for (let s = 1; s <= 300; s++) {
                let ex;
                try {
                    ex = generaExemple({ llavor: s, nivell, errades: err }, TIPUS);
                } catch (e) {
                    continue;
                }
                for (const [j, e] of Object.entries(ex.errades))
                    if (e.tipus === 'TERMES_NO_SEMBLANTS') {
                        n++;
                        if (jaDistingeix(ex._linies, +j)) mal++;
                    }
            }
    ok(n > 0 && mal === 0, `TERMES_NO_SEMBLANTS mai després d'haver agrupat bé termes barrejats (${n} casos)`);
}

// Versemblança A2 i A3 (el David, 26/11/2026)
{
    const ls = [tL([tX(3), tX(1), tN(2)], [tN(9)]), tL([tX(4), tN(2)], [tN(9)])];
    const ops = [null, 'red1', 'red2'];
    ok(!versemblant('COEFICIENT_U', [...ls, ls[1]], ops, 2, null), 'A2: qui ha fet bé 3x + x → 4x no fa després 5x − x → 5x');
    ok(versemblant('COEFICIENT_U', ls, ops, 1, null), 'A2: sense cap pas anterior, sí');
    const ls2 = [tL([tN(-5), tN(2), tX(3)], [tN(7)]), tL([tN(-3), tX(3)], [tN(7)])];
    const res = c => ({ dades: { clau: c } });
    ok(!versemblant('CALCUL', [...ls2, ls2[1]], ops, 2, res('n:-5/1,2/1')), 'A3: el mateix càlcul −5 + 2 ja fet bé: no');
    ok(versemblant('CALCUL', [...ls2, ls2[1]], ops, 2, res('n:-3/1,7/1')), 'A3: un altre càlcul: sí');
}

// SUMA_ABANS_PRODUCTE i el cas bessó de QUOCIENT_INVERTIT (el David, banc d'errades v1, 26/11/2026)
{
    const l = tL([tN(3), T.P(2, -4)], [tX(4), tN(-2)]);
    const rs = resultats('SUMA_ABANS_PRODUCTE', l, 'exp', 200).sort();
    // la variant «5x − 4» està desactivada (enquesta, item 4)
    igual(rs, ['5·(x − 4) = 4x − 2'], 'SUMA_ABANS_PRODUCTE: 3 + 2·(x − 4) → 5·(x − 4), mai 5x − 4');
    igual(resultats('SUMA_ABANS_PRODUCTE', tL([tN(3), T.P(-2, -4)], [tN(1)]), 'exp'), [null], 'SUMA_ABANS_PRODUCTE: no amb un − davant del parèntesi');
    ok(/no vol dir que no es pugui fer/.test(REGLES.QUOCIENT_INVERTIT.expl({ A: 12, B: 3 })), 'QUOCIENT_INVERTIT: explicació del cas bessó (12x = 3 → x = 12/3)');
}

// Tres errades noves (el David, 26/11/2026)
{
    const { I, D } = T;
    const e1 = tL([I(30)], [tN(5)]);
    igual(resol(e1).map(p => text(p.linia)), ['5x = 30', 'x = {30|5}', 'x = 6'], '30/x = 5 → 5x = 30 → x = 30/5 → x = 6');
    igual(resultats('INVERS_X', e1, 'inv'), ['x = 30·5'], 'INVERS_X: 30/x = 5 → x = 30·5');
    const e2 = tL([tX(-4), tN(5), tX(-3)], [tN(6), tX(-1)]);
    igual(text(aplica('neg', e2)), '4x − 5 + 3x = −6 + x', 'neg: −4x + 5 − 3x = 6 − x → 4x − 5 + 3x = −6 + x');
    const r2 = resultats('CANVI_SIGNE_PARCIAL', e2, 'neg', 300);
    ok(r2.includes('4x − 5 + 3x = 6 + x') && r2.includes('4x + 5 + 3x = −6 + x'), 'CANVI_SIGNE_PARCIAL: les dues variants del David');
    const e3 = tL([D(1, 3, 5, 2), D(-1, 1, -4, 3)], [tX(5)]);
    igual(text(aplica('den', e3)), '9x + 15 − 2x + 8 = 30x', 'den: (3x + 5)/2 − (x − 4)/3 = 5x → 9x + 15 − 2x + 8 = 30x');
    const r3 = resultats('DENOMINADORS', e3, 'den', 300);
    ok(r3.includes('9x + 15 − 2x − 8 = 30x') && r3.includes('9x + 15 − 2x + 8 = 5x'), 'DENOMINADORS: signe i termes sense denominador');
    ok(aplica('neg', tL([tX(3), tN(1)], [tX(1)])) === null, 'neg: no si no comença amb una x negativa');
}

informe('generador');
