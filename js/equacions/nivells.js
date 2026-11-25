/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/equacions/nivells.js
 * ROL: Què vol dir cada nivell (N5 amb el retoc de R5, docs/SPEC.md §6): de
 *      quin tipus és l'enunciat, quantes errades té cada exemple, si es diu
 *      quantes n'hi ha i si hi ha la fase del terme.
 * ARQUITECTURA:
 * - parametres(nivell, noerrors, llavor) és pur i determinista: la mateixa
 *   llavor dona el mateix nombre d'errades.
 *   1: una errada anunciada, sense parèntesis (4–5 línies)
 *   2: una errada anunciada, amb parèntesis (6–8 línies)
 *   3: una errada, sense dir quantes n'hi ha
 *   4: dues errades anunciades (a vegades es compensen) i fase del terme
 *   5: una o dues, sense dir-ho (a vegades es compensen) i fase del terme
 *   Amb noerrors=1 (R5): a tots els nivells, més o menys 1 exemple de cada 5
 *   no té cap errada, i la consigna no diu mai quantes n'hi ha.
 * DEPENDÈNCIES: js/equacions/generador.js (creaAtzar).
 * ============================================================================
 */
import { creaAtzar } from './generador.js';

export const NIVELLS = {
    1: 'una errada, sense parèntesis',
    2: 'una errada, amb parèntesis',
    3: 'una errada, sense dir-ho',
    4: 'dues errades i el terme equivocat',
    5: 'una o dues errades, sense dir-ho',
};
export const PROPORCIO_SENSE_ERRADES = 0.2;
export const PROPORCIO_COMPENSADES = 0.3;

export function parametres(nivell, noerrors, llavor) {
    const r = creaAtzar((llavor ^ 0x9e3779b9) >>> 0);
    const forma = nivell === 1 ? 1 : 2;
    let errades = 1,
        compensades = false;
    if (nivell === 4) errades = 2;
    if (nivell === 5) errades = r() < 0.5 ? 1 : 2;
    if (errades === 2) compensades = r() < PROPORCIO_COMPENSADES;
    if (noerrors && r() < PROPORCIO_SENSE_ERRADES) {
        errades = 0;
        compensades = false;
    }
    return { forma, errades, compensades, anuncia: !noerrors && nivell !== 3 && nivell !== 5, terme: nivell >= 4 };
}

/**
 * Es pot fer servir aquest exemple del banc (data/banc.json) en aquest nivell?
 * Es mira el nombre d'errades i si l'enunciat té parèntesis (forma 2).
 */
export function encaixaBanc(ex, nivell, noerrors) {
    const n = Object.keys(ex.errades || {}).length;
    const forma = ex.linies[0].some(t => t.includes('(')) ? 2 : 1;
    if (n === 0) return !!noerrors;
    if (nivell === 1) return forma === 1 && n === 1;
    if (nivell === 2) return forma === 2 && n === 1;
    if (nivell === 3) return n === 1;
    if (nivell === 4) return n === 2;
    return n === 1 || n === 2;
}
export const PROPORCIO_BANC = 1 / 3;
