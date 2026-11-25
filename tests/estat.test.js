// tests/estat.test.js — la màquina d'estats d'un exemple (js/motor/estat.js).
import { nouEstat, selecciona, comprova, triaPerque, triaCorreccio, capMes, punts, CONFIG_PER_DEFECTE } from '../js/motor/estat.js';
import { ok, igual, informe } from './lib.js';

// L'exemple del David: 2·(x + 4) = 13 − 7x, errada a la línia 2 (índex 1)
const EX = {
    alumne: 'la Marta',
    linies: [['2·(x + 4)', '=', '13', '− 7x'], ['2x', '+ 4', '=', '13', '− 7x'], ['2x', '+ 7x', '=', '13', '− 4'], ['9x', '=', '9'], ['x', '=', '1']],
    errades: {
        1: { tipus: 'DISTRIBUTIVA', terme: 1, expl: 'El 2 multiplica tots els termes.', bona: '2x + 8 = 13 − 7x', perque: [['a', false], ['b', true], ['c', false]], opcions: [['x', false], ['y', false], ['2x + 8 = 13 − 7x', true]] },
    },
    correctes: { 2: 'Aquesta línia és correcta (2).', 3: 'Aquesta línia és correcta (3).', 4: 'Aquesta línia és correcta (4).' },
};
const cfg = { ...CONFIG_PER_DEFECTE };
const tria = (S, i) => (selecciona(S, EX, i), comprova(S, EX, cfg));

// Encert a la primera: Per què? → Corregeix-la → fi, 10 punts
let S = nouEstat();
tria(S, 1);
igual([S.fase, S.msg.tipus], ['perque', 'encert'], 'encert → fase «Per què?»');
triaPerque(S, EX, cfg, 0);
igual([S.fase, S.msg.tipus], ['corregeix', 'noEncert'], '«Per què?» equivocat → «Corregeix-la», sense treure punts');
triaCorreccio(S, EX, cfg, 2);
igual([S.fi, punts(S), S.corregides[1]], [true, 10, true], 'corregida → fi amb 10 punts');

// L'enunciat no es pot assenyalar
S = nouEstat();
selecciona(S, EX, 0);
igual([S.sel, S.errors], [null, 0], "l'enunciat no es pot assenyalar");

// Escala: 1r error explica, 2n afegeix la direcció, 3r ensenya l'errada i val 0
S = nouEstat();
tria(S, 3);
ok(S.msg.text.startsWith('No és aquí. Aquesta línia és correcta (3).') && !/amunt|avall/.test(S.msg.text), '1r error: explica per què la línia és bona');
ok(S.revisades.includes(3) && punts(S) === 8, '1r error: línia revisada i 8 punts');
selecciona(S, EX, 3);
ok(S.sel === null, 'una línia revisada ja no es pot tornar a triar');
tria(S, 4);
ok(/L'errada és més amunt\./.test(S.msg.text) && punts(S) === 6, '2n error: diu cap on és; 6 punts');
tria(S, 2);
igual([S.trobades, S.ajuda, S.fi, punts(S)], [[1], [1], true, 0], "3r error: ensenya l'errada; 0 punts");

// Sense fases
S = nouEstat();
selecciona(S, EX, 1);
comprova(S, EX, { ...cfg, perque: false, corregeix: false });
igual([S.fi, punts(S)], [true, 10], 'sense fases: encert → fi');

// Sense dir quantes n'hi ha: cal prémer «No n'hi ha cap més»
const sense = { ...cfg, anuncia: false, perque: false, corregeix: false };
S = nouEstat();
capMes(S, EX, sense);
igual([S.fi, S.errors], [false, 1], "«No hi ha cap errada» quan n'hi ha: compta com a error");
selecciona(S, EX, 1);
comprova(S, EX, sense);
ok(!S.fi, "sense anunciar, trobar-la no acaba l'exemple");
capMes(S, EX, sense);
igual([S.fi, punts(S)], [true, 8], "«No n'hi ha cap més» → fi");

// Un exemple sense errades
const CAP = { ...EX, errades: {}, correctes: { 1: 'ok', 2: 'ok', 3: 'ok', 4: 'ok' } };
S = nouEstat();
capMes(S, CAP, sense);
igual([S.fi, punts(S)], [true, 10], 'cap errada: «No hi ha cap errada» → 10 punts');

// maxIntents = 1: el primer error ensenya l'errada
S = nouEstat();
selecciona(S, EX, 3);
comprova(S, EX, { ...cfg, maxIntents: 1 });
igual([S.fi, punts(S), S.ajuda], [true, 0, [1]], 'maxIntents 1');
informe('estat');
