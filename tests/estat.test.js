// tests/estat.test.js — la màquina d'estats d'un exemple (js/motor/estat.js).
import { nouEstat, selecciona, comprova, triaTerme, triaPerque, triaCorreccio, escriuCorreccio, escriuAra, capMes, punts, CONFIG_PER_DEFECTE } from '../js/motor/estat.js';
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
ok(S.msg.text === 'Aquesta línia és correcta (3).', '1r error: explica per què la línia és bona');
ok(S.revisades.includes(3) && punts(S) === 8, '1r error: línia revisada i 8 punts');
selecciona(S, EX, 3);
ok(S.sel === null, 'una línia revisada ja no es pot tornar a triar');
selecciona(S, EX, 4);
ok(S.msg === null, 'en triar una altra línia, el missatge anterior desapareix');
selecciona(S, EX, 4);
tria(S, 4);
ok(/\nL'errada és més amunt\./.test(S.msg.text) && punts(S) === 6, '2n error: diu cap on és, en una línia nova; 6 punts');
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
// Fase del terme (nivells 4 i 5): l'encert va a «Per què?», sense treure punts
const ct = { ...cfg, terme: true };
S = nouEstat();
selecciona(S, EX, 1);
comprova(S, EX, ct);
igual(S.fase, 'terme', 'amb cfg.terme, després de trobar la línia es demana el terme');
triaTerme(S, EX, ct, 0);
igual([S.fase, S.msg.tipus, punts(S)], ['terme', 'noEncert', 10], 'un terme bo: es torna a demanar, sense treure punts');
triaTerme(S, EX, ct, 1);
igual([S.fase, S.termes[1]], ['perque', true], 'el terme equivocat → «Per què?»');
S = nouEstat();
selecciona(S, EX, 1);
comprova(S, EX, ct);
triaTerme(S, EX, ct, 0);
triaTerme(S, EX, ct, 3);
ok(S.fase === 'perque' && S.termes[1] && /encerclat/.test(S.msg.text), "al segon terme equivocat, s'ensenya el bo i es continua");

// Dues errades, anunciades: després de la primera, se'n continua buscant una altra
const EX2 = {
    ...EX,
    errades: { ...EX.errades, 3: { tipus: 'CALCUL', terme: 2, expl: 'e', bona: '9x = 5', perque: [['a', true], ['b', false], ['c', false], ['d', false]], opcions: [['9x = 5', true], ['y', false], ['z', false]] } },
    correctes: { 2: 'ok2', 4: 'ok4' },
};
S = nouEstat();
selecciona(S, EX2, 1);
comprova(S, EX2, cfg);
triaPerque(S, EX2, cfg, 1);
triaCorreccio(S, EX2, cfg, 2);
ok(!S.fi && S.fase === 'busca' && /Encara en queda una\./.test(S.msg.text), 'dues errades: després de la primera, en queda una');
selecciona(S, EX2, 3);
comprova(S, EX2, cfg);
triaPerque(S, EX2, cfg, 0);
triaCorreccio(S, EX2, cfg, 0);
igual([S.fi, punts(S), S.trobades], [true, 10, [1, 3]], 'dues errades trobades → fi');
// «Corregeix-la» escrivint el terme (escriu=1)
const EXE = { ...EX, errades: { 1: { ...EX.errades[1], fitxesBona: ['2x', '+ 8', '=', '13', '− 7x'] } } };
const ce = { ...cfg, escriu: true };
S = nouEstat();
selecciona(S, EXE, 1);
comprova(S, EXE, ce);
triaPerque(S, EXE, ce, 1);
ok(escriuAra(S, EXE, ce), 'amb escriu=1, «Corregeix-la» es fa escrivint');
escriuCorreccio(S, EXE, ce, '+4');
igual([S.fi, S.msg.tipus], [false, 'noEncert'], 'escriure malament: es pot tornar a provar');
escriuCorreccio(S, EXE, ce, '8');
igual([S.fi, punts(S), S.corregides[1]], [true, 10, true], 'escriure el terme bo: corregida, sense treure punts');
S = nouEstat();
selecciona(S, EXE, 1);
comprova(S, EXE, ce);
triaPerque(S, EXE, ce, 1);
escriuCorreccio(S, EXE, ce, '4');
escriuCorreccio(S, EXE, ce, '6');
ok(S.fi && /Havia de ser/.test(S.msg.text), "al segon intent fallit s'ensenya el terme bo");
ok(!escriuAra(nouEstat(), EX, ce), 'sense fitxesBona no es pot escriure (es tria)');
// Dos termes equivocats (SIGNE_TRANSPOSAR amb els dos termes): a la fase del terme valen tots dos
{
    const ex2 = JSON.parse(JSON.stringify(EX));
    ex2.linies[2] = ['2x', '− 7x', '=', '13', '+ 4'];
    ex2.errades = { 2: { ...EX.errades[1], tipus: 'SIGNE_TRANSPOSAR', terme: 1, termes: [1, 4] } };
    for (const j of [1, 4]) {
        const S = nouEstat();
        const cfg = { ...CONFIG_PER_DEFECTE, terme: true };
        selecciona(S, ex2, 2);
        comprova(S, ex2, cfg);
        triaTerme(S, ex2, cfg, j);
        ok(S.fase === 'perque' && /un dels termes equivocats/.test(S.msg.text), `dos termes: el terme ${j} també és bo`);
    }
    const S = nouEstat();
    const cfg = { ...CONFIG_PER_DEFECTE, terme: true };
    selecciona(S, ex2, 2);
    comprova(S, ex2, cfg);
    triaTerme(S, ex2, cfg, 0);
    triaTerme(S, ex2, cfg, 3);
    ok(S.fase === 'perque' && /els termes equivocats són/.test(S.msg.text), 'dos termes: després de dos intents, es diuen tots dos');
}
informe('estat');
