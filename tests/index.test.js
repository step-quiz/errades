// tests/index.test.js — el generador d'enllaços de l'índex (js/index.js).
import { enllac } from '../js/index.js';
import { igual, informe } from './lib.js';
const B = 'https://errades.step-quiz.net/equacions.html';
igual(enllac(B, { nivell: '1', totaloperations: '6', maxintents: '3' }), B, 'els valors per defecte no surten a l\'enllaç');
igual(enllac(B, { nivell: '2', totaloperations: '10', maxintents: '3' }), B + '?nivell=2&totaloperations=10', 'nivell 2 i 10 exemples');
igual(enllac(B, { nivell: '9', totaloperations: '0', maxintents: 'x' }), B + '?nivell=5&totaloperations=1', 'valors fora de marge');
igual(enllac(B, { nivell: '3', noerrors: '1' }), B + '?nivell=3&noerrors=1', 'nivell 3 amb exemples sense errades');
igual(enllac(B, { nivell: '4', escriu: '1' }), B + '?nivell=4&escriu=1', 'nivell 4 escrivint la correcció');
informe('index');
