// tests/nivells.test.js — què vol dir cada nivell (js/equacions/nivells.js) i el banc a la pàgina.
import fs from 'node:fs';
import { encaixaBanc } from '../js/equacions/nivells.js';
import { parametres, PROPORCIO_SENSE_ERRADES } from '../js/motor/nivells.js';
import { exempleSessio, llegeixParametres } from '../js/equacions/pagina.js';
import { generaExemple, perPagina, valida } from '../js/equacions/generador.js';
import { ok, igual, informe } from './lib.js';

const TIPUS = JSON.parse(fs.readFileSync(new URL('../data/errors.json', import.meta.url), 'utf8'));
const compta = (nivell, noerrors) => {
    const c = { 0: 0, 1: 0, 2: 0, comp: 0 };
    for (let s = 1; s <= 2000; s++) {
        const p = parametres(nivell, noerrors, s);
        c[p.errades]++;
        if (p.compensades) c.comp++;
    }
    return c;
};
igual(compta(1, false), { 0: 0, 1: 2000, 2: 0, comp: 0 }, 'nivell 1: sempre una errada');
igual(compta(3, false), { 0: 0, 1: 2000, 2: 0, comp: 0 }, 'nivell 3: sempre una errada (sense dir-ho)');
ok(compta(4, false)[2] === 2000 && compta(4, false).comp > 400 && compta(4, false).comp < 800, 'nivell 4: dues errades, unes 3 de cada 10 compensades');
const c5 = compta(5, false);
ok(c5[0] === 0 && c5[1] > 800 && c5[2] > 800, 'nivell 5: una o dues');
for (const n of [1, 2, 3, 4, 5]) {
    const c = compta(n, true);
    ok(Math.abs(c[0] / 2000 - PROPORCIO_SENSE_ERRADES) < 0.04, `nivell ${n} amb noerrors: més o menys 1 de cada 5 sense errades (${c[0]})`);
    ok(compta(n, false)[0] === 0, `nivell ${n} sense noerrors: cap exemple sense errades`);
}
igual([1, 2, 3, 4, 5].map(n => parametres(n, false, 1).anuncia), [true, true, false, true, false], 'es diu quantes n\'hi ha als nivells 1, 2 i 4');
ok([1, 2, 3, 4, 5].every(n => !parametres(n, true, 1).anuncia), 'amb noerrors no es diu mai');
igual(llegeixParametres('?nivell=4&noerrors=1&llavor=7'), { nivell: 4, noerrors: true, escriu: false, encercla: -1, total: 6, maxIntents: 3, llavor: 7, membre: 'membre', nota: true }, 'paràmetres de l\'adreça');
ok(llegeixParametres('?escriu=1').escriu === true, 'escriu=1');
import { encerclaDe } from '../js/motor/parametres.js';
ok(encerclaDe(llegeixParametres(''), true) && !encerclaDe(llegeixParametres(''), false), 'encercla automàtic: només a les pantalles tàctils');
ok(encerclaDe(llegeixParametres('?encercla=1'), false) && !encerclaDe(llegeixParametres('?encercla=0'), true), 'encercla=1 i encercla=0 manen');

// Exemples de sessió de tots els nivells: vàlids i amb el nombre d'errades del nivell
for (const nivell of [1, 2, 3, 4, 5])
    for (const noerrors of [false, true])
        for (let i = 0; i < 60; i++) {
            const ex = exempleSessio(i, { base: 1000 * nivell, nivell, noerrors, tipus: TIPUS, banc: [] });
            const n = Object.keys(ex.errades).length;
            ok(encaixaBanc(ex, nivell, noerrors), `nivell ${nivell}${noerrors ? ' noerrors' : ''}, exemple ${i}: ${n} errades no encaixen amb el nivell`);
        }

// El banc: si n'hi ha exemples que encaixen, en surt més o menys 1 de cada 3
const delBanc = perPagina(generaExemple({ llavor: 99, nivell: 1, errades: 1 }, TIPUS));
let delBancN = 0;
const mateix = (a, b) => JSON.stringify(a.linies) === JSON.stringify(b.linies);
for (let i = 0; i < 600; i++) if (mateix(exempleSessio(i, { base: 5, nivell: 1, noerrors: false, tipus: TIPUS, banc: [delBanc] }), delBanc)) delBancN++;
ok(delBancN > 150 && delBancN < 250, `banc: n'hauria de sortir 1 de cada 3 (${delBancN} de 600)`);
ok(exempleSessio(0, { base: 5, nivell: 4, noerrors: false, tipus: TIPUS, banc: [delBanc] }) !== delBanc || false, 'un exemple d\'una errada no surt al nivell 4');
let n4 = 0;
for (let i = 0; i < 100; i++) if (mateix(exempleSessio(i, { base: 5, nivell: 4, noerrors: false, tipus: TIPUS, banc: [delBanc] }), delBanc)) n4++;
ok(n4 === 0, 'el banc només dona exemples que encaixen amb el nivell');
// Els exemples del banc (data/banc.json) són vàlids
const banc = JSON.parse(fs.readFileSync(new URL('../data/banc.json', import.meta.url), 'utf8')).exemples;
ok(Array.isArray(banc), 'data/banc.json té una llista «exemples»');
// Dins d'una sessió, cap exemple del banc no es repeteix mentre n'hi hagi d'altres (auditoria E1): nivell 4, 4 exemples
let repetides = 0;
for (let base = 1; base <= 400; base++) {
    const ids = [];
    for (let i = 0; i < 6; i++) {
        const ex = exempleSessio(i, { base, nivell: 4, noerrors: false, tipus: TIPUS, banc });
        if (ex.banc) ids.push(ex.banc);
    }
    if (ids.length <= 4 && new Set(ids).size !== ids.length) repetides++;
}
ok(repetides === 0, `cap exemple del banc repetit en una sessió de 6 (${repetides} sessions amb repeticions)`);
// Les opcions dels exemples del banc es barregen: la frase certa de «Per què?» no és sempre al mateix lloc
const llocs = new Set();
for (let i = 0; i < 300; i++) {
    const ex = exempleSessio(i, { base: 11, nivell: 1, noerrors: false, tipus: TIPUS, banc });
    if (ex.banc) for (const e of Object.values(ex.errades)) llocs.add(e.perque.findIndex(o => o[1]));
}
ok(llocs.size === 3, 'banc: la frase certa canvia de lloc');
informe('nivells');
