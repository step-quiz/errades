// tests/index.test.js — el generador d'enllaços de l'índex (js/index.js).
import { enllac, pagina, NIVELLS, PER_DEFECTE } from '../js/index.js';
import { llegeixParametres } from '../js/motor/parametres.js';
import { igual, ok, informe } from './lib.js';
const B = 'https://errades.step-quiz.net/equacions.html';
igual(enllac(B, { nivell: '1', totaloperations: '6', maxintents: '3', encercla: 'auto', llavor: '' }), B, 'els valors per defecte no surten a l\'enllaç');
igual(enllac(B, { nivell: '2', totaloperations: '10', maxintents: '3' }), B + '?nivell=2&totaloperations=10', 'nivell 2 i 10 exemples');
igual(enllac(B, { nivell: '9', totaloperations: '0', maxintents: 'x' }), B + '?nivell=5&totaloperations=1', 'valors fora de marge');
igual(enllac(B, { nivell: '3', noerrors: '1' }), B + '?nivell=3&noerrors=1', 'nivell 3 amb exemples sense errades');
igual(enllac(B, { nivell: '4', escriu: '1' }), B + '?nivell=4&escriu=1', 'nivell 4 escrivint la correcció');
igual(enllac(B, { encercla: '1' }), B + '?encercla=1', 'encerclar sempre');
igual(enllac(B, { encercla: '0' }), B + '?encercla=0', 'tocar sempre');
igual(enllac(B, { llavor: ' 1234 ' }), B + '?llavor=1234', 'llavor: tothom els mateixos exemples');
igual(enllac(B, { llavor: 'abc' }), B, 'llavor que no és un número: no surt');
igual(pagina('prioritat'), 'prioritat.html', 'la prioritat d\'operacions va a prioritat.html');
igual(pagina('res'), 'equacions.html', 'una activitat desconeguda va a les equacions');
ok([1, 2, 3, 4, 5].every(n => NIVELLS.equacions[n] && NIVELLS.prioritat[n]), 'descripció de cada nivell de les dues activitats');
// El que escriu l'índex és el que llegeix l'activitat
const tot = enllac(B, { nivell: '4', noerrors: '1', escriu: '1', encercla: '0', totaloperations: '8', maxintents: '2', llavor: '77' });
igual(llegeixParametres(new URL(tot).search), { nivell: 4, noerrors: true, escriu: true, encercla: 0, total: 8, maxIntents: 2, llavor: 77 }, "l'activitat llegeix tots els paràmetres de l'índex");
ok(Object.keys(PER_DEFECTE).length === 7, 'set paràmetres');
informe('index');
