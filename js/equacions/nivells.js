/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/equacions/nivells.js
 * ROL: El que els nivells tenen de propi a les equacions: quins exemples del
 *      banc (data/banc.json) encaixen amb un nivell (encaixaBanc). Pur. Les
 *      etiquetes dels nivells són a js/motor/nivells.js (auditoria 2, C2).
 * ARQUITECTURA:
 * - Què vol dir cada nivell (forma, errades, si s'anuncia) és comú a les dues
 *   activitats: js/motor/nivells.js (parametres).
 * - encaixaBanc mira el nombre d'errades, la forma de l'enunciat (1: sense
 *   parèntesis, 4–6 línies; 2: amb parèntesis, 6–8 línies) i que cap errada
 *   no sigui d'una regla desactivada (DESACTIVADES del generador).
 * - PROPORCIO_BANC: més o menys 1 exemple de cada 3 surt del banc (R6).
 * DEPENDÈNCIES: js/equacions/generador.js (DESACTIVADES).
 * ============================================================================
 */
import { DESACTIVADES } from './generador.js';

/**
 * Es pot fer servir aquest exemple del banc (data/banc.json) en aquest nivell?
 * Es mira el nombre d'errades i si l'enunciat té parèntesis (forma 2).
 */
export function encaixaBanc(ex, nivell, noerrors) {
    const n = Object.keys(ex.errades || {}).length;
    // la forma de l'enunciat: la que diu l'exemple (el generador i el banc la porten); si no, amb parèntesis és la 2
    const forma = ex.nivell === 1 || ex.nivell === 2 ? ex.nivell : ex.linies[0].some(t => t.includes('(')) ? 2 : 1;
    if (n === 0) return !!noerrors;
    // cap exemple amb una regla desactivada (enquesta del banc d'errades, 28/11/2026)
    if (Object.values(ex.errades).some(e => DESACTIVADES.includes(e.tipus))) return false;
    if (nivell === 1) return forma === 1 && n === 1;
    if (nivell === 2) return forma === 2 && n === 1;
    if (nivell === 3) return n === 1;
    if (nivell === 4) return n === 2;
    return n === 1 || n === 2;
}
export const PROPORCIO_BANC = 1 / 3;
