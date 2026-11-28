// tests/escriure.test.js — «Corregeix-la» escrivint el terme (js/motor/escriure.js).
import fs from 'node:fs';
import { llegeix, valorFitxa, correcte, escrivible } from '../js/motor/escriure.js';
import { generaExemple } from '../js/equacions/generador.js';
import { ok, igual, informe } from './lib.js';

igual(llegeix('+8'), { x: false, n: 8, d: 1 }, '+8');
igual(llegeix(' −7x '), { x: true, n: -7, d: 1 }, '−7x');
igual(llegeix('x'), { x: true, n: 1, d: 1 }, 'x');
igual(llegeix('-x'), { x: true, n: -1, d: 1 }, '-x');
igual(llegeix('10/2'), { x: false, n: 10, d: 2 }, '10/2');
for (const t of ['', '+', '/2', '3/0', '2/3x', 'x2', '8a', '++8']) ok(llegeix(t) === null, `«${t}» no s'entén`);
igual(valorFitxa('+ 8'), { x: false, n: 8, d: 1 }, 'fitxa «+ 8»');
igual(valorFitxa('− 7x'), { x: true, n: -7, d: 1 }, 'fitxa «− 7x»');
igual(valorFitxa('{−2|2}'), { x: false, n: -2, d: 2 }, 'fitxa «{−2|2}»');
igual(valorFitxa('−{5|2}'), { x: false, n: -5, d: 2 }, 'fitxa «−{5|2}»');
igual(valorFitxa('{9|−3}'), { x: false, n: -9, d: 3 }, 'fitxa «{9|−3}»');
ok(correcte('-3', '{9|−3}') && correcte('9/-3', '{9|−3}') && correcte('−9/3', '{9|−3}'), '−3, 9/−3 i −9/3 valen per {9|−3}');
ok(correcte('8', '+ 8') && correcte('+8', '+ 8') && !correcte('-8', '+ 8'), '8 i +8 valen per «+ 8»; −8 no');
ok(correcte('5', '{10|2}') && correcte('10/2', '{10|2}'), '5 i 10/2 són el mateix valor');
ok(!correcte('8', '+ 8x') && correcte('8x', '+ 8x'), 'un terme amb x no és un nombre');

// Als exemples generats: quan és escrivible, la fitxa bona és la resposta correcta i la dolenta no
const TIPUS = JSON.parse(fs.readFileSync(new URL('../data/errors.json', import.meta.url), 'utf8'));
const vistos = {};
for (let s = 1; s <= 800; s++)
    for (const nivell of [1, 2]) {
        const ex = generaExemple({ llavor: s, nivell });
        for (const [j, e] of Object.entries(ex.errades)) {
            const pot = escrivible(e, ex.linies[j]);
            vistos[e.tipus] = vistos[e.tipus] || { si: 0, no: 0 };
            vistos[e.tipus][pot ? 'si' : 'no']++;
            if (!pot) continue;
            ok(valorFitxa(e.fitxesBona[e.terme]) !== null, `llavor ${s}: la fitxa bona «${e.fitxesBona[e.terme]}» s'ha de poder llegir`);
            ok(!correcte(ex.linies[j][e.terme].replace(/\{([^|]+)\|([^}]+)\}/, '$1/$2'), e.fitxesBona[e.terme]), `llavor ${s}: la fitxa dolenta no pot ser correcta`);
        }
    }
console.log('  escrivible per tipus: ' + JSON.stringify(vistos));
for (const t of ['DISTRIBUTIVA', 'DIST_SIGNE', 'SIGNE_TRANSPOSAR', 'CALCUL', 'OPERACIO_INVERSA', 'DIVISIO_SIGNE', 'QUOCIENT_INVERTIT'])
    ok(vistos[t] && vistos[t].si > vistos[t].no, `${t} hauria de ser escrivible gairebé sempre`);
informe('escriure');
