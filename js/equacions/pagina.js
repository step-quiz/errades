/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/equacions/pagina.js
 * ROL: Punt d'entrada d'equacions.html: com és l'exemple i-èsim d'una sessió
 *      d'equacions (del banc o del generador).
 * ARQUITECTURA:
 * - Paràmetres: js/motor/parametres.js (comuns a les dues activitats).
 * - Què vol dir cada nivell: js/equacions/nivells.js.
 * - Banc (R6): més o menys 1 exemple de cada 3 surt de data/banc.json, si n'hi
 *   ha cap que encaixi amb el nivell; la resta, del generador. Dins d'una sessió,
 *   cap exemple del banc no es repeteix fins que no han sortit tots (auditoria E1),
 *   i les seves opcions es barregen amb la llavor de l'exercici.
 * - «membre» (paràmetre de l'adreça): la paraula de les frases de «Per què?»
 *   (exempleAmbParaula, frases.js), per als exemples generats i els del banc.
 * - La resta (adreça, sessió desada, capçalera, informe) és de js/motor/activitat.js (auditoria 2, C1).
 * DEPENDÈNCIES: generador.js, frases.js, nivells.js, js/motor/activitat.js.
 * ============================================================================
 */
import * as generador from './generador.js';
import { creaAtzar } from './generador.js';
import { exempleAmbParaula } from './frases.js';
import { encaixaBanc, PROPORCIO_BANC } from './nivells.js';
import { barreja } from '../motor/atzar.js';
import { engega, exempleGenerat, llavorExercici } from '../motor/activitat.js';
import { llegeixParametres } from '../motor/parametres.js';

export { llegeixParametres };

/** L'exemple i-èsim d'una sessió: del banc o del generador (pur, per a les proves). */
export function exempleSessio(i, { base, nivell, noerrors, banc = [], membre = 'membre' }) {
    return exempleAmbParaula(exempleBrut(i, { base, nivell, noerrors, banc }), membre);
}
/** L'atzar de l'exercici i: el primer valor decideix si surt del banc (R6). */
const atzarExercici = (base, i) => creaAtzar((llavorExercici(base, i) ^ 0x5bd1e995) >>> 0);
/**
 * Els exemples del banc d'una sessió no es repeteixen (auditoria E1, 28/11/2026): la k-èsima vegada que un exercici
 * surt del banc, agafa la posició k d'una permutació del banc feta amb la llavor de la sessió. Només si el banc
 * s'acaba es torna a començar, amb una altra permutació. Les opcions es barregen amb la llavor de l'exercici.
 */
function delBancSessio(i, base, delBanc) {
    let k = 0;
    for (let j = 0; j < i; j++) if (atzarExercici(base, j)() < PROPORCIO_BANC) k++;
    const volta = Math.floor(k / delBanc.length);
    const ordre = barreja(creaAtzar(((base ^ 0x2c1b3c6d) + volta * 104729) >>> 0), delBanc);
    const ex = ordre[k % delBanc.length];
    const r = creaAtzar((llavorExercici(base, i) ^ 0x68e31da4) >>> 0);
    const errades = {};
    for (const [j, e] of Object.entries(ex.errades || {})) errades[j] = { ...e, perque: barreja(r, e.perque), opcions: barreja(r, e.opcions) };
    return { ...ex, errades };
}
function exempleBrut(i, { base, nivell, noerrors, banc }) {
    const delBanc = banc.filter(b => encaixaBanc(b, nivell, noerrors));
    if (delBanc.length && atzarExercici(base, i)() < PROPORCIO_BANC) return delBancSessio(i, base, delBanc);
    return exempleGenerat(generador, nivell, noerrors, base, i);
}

engega({
    activitat: 'equacions',
    taxonomia: 'data/errors.json',
    dades: { banc: 'data/banc.json' },
    exemple: (i, { base, par, dades }) =>
        exempleSessio(i, { base, nivell: par.nivell, noerrors: par.noerrors, banc: (dades.banc && Array.isArray(dades.banc.exemples) && dades.banc.exemples) || [], membre: par.membre }),
});
