/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/prioritat/pagina.js
 * ROL: Punt d'entrada de prioritat.html: com és l'exemple i-èsim d'una sessió de
 *      prioritat d'operacions. La resta (adreça, sessió, capçalera) és de
 *      js/motor/activitat.js.
 * ARQUITECTURA:
 * - Nivells: js/motor/nivells.js (comuns a les dues activitats); la forma 1
 *   (nivell 1) és sense parèntesis ni potències, i la forma 2 (nivells 2–5) en té.
 * - No hi ha banc: tots els exemples surten del generador.
 * DEPENDÈNCIES: generador.js, js/motor/activitat.js.
 * ============================================================================
 */
import * as generador from './generador.js';
import { engega, exempleGenerat } from '../motor/activitat.js';

/** L'exemple i-èsim d'una sessió (pur, per a les proves). */
export const exempleSessio = (i, { base, nivell, noerrors }) => exempleGenerat(generador, nivell, noerrors, base, i);

engega({
    activitat: 'prioritat',
    taxonomia: 'data/errors-prioritat.json',
    exemple: (i, { base, par }) => exempleSessio(i, { base, nivell: par.nivell, noerrors: par.noerrors }),
});
