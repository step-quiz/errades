// tests/llac.test.js — encerclar amb el dit (R3): de quina línia i de quins termes parla un traç.
import { avalua, dins } from '../js/motor/llac.js';
import { ok, igual, informe } from './lib.js';

// Tres línies de 40 px d'alt; cada una amb quatre termes a x = 50, 100, 150, 200
const linies = [0, 1, 2].map(i => ({ i, t: i * 40, b: i * 40 + 40, termes: [0, 1, 3, 4].map((j, k) => ({ j, cx: 50 + 50 * k, cy: i * 40 + 20 })) }));
const cercle = (cx, cy, rx, ry, n = 24) => Array.from({ length: n + 1 }, (_, k) => [cx + rx * Math.cos((2 * Math.PI * k) / n), cy + ry * Math.sin((2 * Math.PI * k) / n)]);

ok(dins([5, 5], [[0, 0], [10, 0], [10, 10], [0, 10]]) && !dins([15, 5], [[0, 0], [10, 0], [10, 10], [0, 10]]), 'punt dins d\'un quadrat');
igual(avalua(cercle(100, 60, 22, 14), linies), { linia: 1, termes: [1] }, 'un terme encerclat: la línia i el terme');
igual(avalua(cercle(125, 60, 45, 14), linies), { linia: 1, termes: [1, 3] }, 'dos termes encerclats');
igual(avalua(cercle(125, 60, 110, 16), linies), { linia: 1, termes: [] }, 'tota la línia encerclada: la línia, sense termes');
ok(avalua(cercle(100, 40, 22, 30), linies).torna === "el traç envolta termes de més d'una línia.", 'termes de dues línies → torna-ho a marcar');
ok(avalua([[10, 10], [12, 11], [13, 12], [14, 12]], linies).torna === 'el traç és massa petit.', 'traç massa petit');
igual(avalua([[30, 70], [80, 72], [130, 71], [180, 73], [220, 72]], linies), { linia: 1, termes: [] }, 'subratllat obert sobre una línia');
ok(/més d'una línia/.test(avalua([[30, 5], [80, 35], [130, 60], [180, 90], [220, 115]], linies).torna || ''), 'traç obert en diagonal per tres línies → torna-ho a marcar');
ok(avalua([[30, 300], [80, 302], [130, 301], [180, 303]], linies).torna === 'no sé quina línia has marcat.', 'traç fora de les línies');
igual(avalua(cercle(400, 60, 30, 14), linies), { linia: 1, termes: [] }, 'cercle tancat a la dreta de la línia, sense termes: la línia que cobreix');
informe('llac');
