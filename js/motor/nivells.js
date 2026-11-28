/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/motor/nivells.js
 * ROL: Què vol dir cada nivell (N5 amb el retoc de R5, docs/SPEC.md §6), igual a
 *      les dues activitats: de quina forma és l'enunciat, quantes errades té cada
 *      exemple i si es diu quantes n'hi ha (la fase del terme és a tots els nivells).
 * ARQUITECTURA:
 * - parametres(nivell, noerrors, llavor) és pur i determinista: la mateixa
 *   llavor dona el mateix nombre d'errades.
 *   1: una errada anunciada, forma 1 (equacions sense parèntesis; prioritat sense
 *      parèntesis ni potències)
 *   2: una errada anunciada, forma 2 (amb parèntesis; prioritat: o potències)
 *   3: una errada, sense dir quantes n'hi ha
 *   4: dues errades anunciades (a vegades es compensen)
 *   5: una o dues, sense dir-ho (a vegades es compensen)
 *   Amb noerrors=1 (R5): a tots els nivells, més o menys 1 exemple de cada 5
 *   no té cap errada, i la consigna no diu mai quantes n'hi ha.
 * - NIVELLS (auditoria 2, C2): l'única taula de les etiquetes, per activitat; index és el
 *   text del desplegable de l'índex, errades i detall fan la capçalera de la pàgina.
 *   capcalera(activitat, nivell, noerrors): «Nivell 1 · una errada, sense parèntesis»; amb
 *   noerrors=1 no es diu quantes errades hi ha (P12, el David, 28/11/2026): «Nivell 1 ·
 *   sense parèntesis · pot ser que no hi hagi cap errada».
 * - El banc és només de les equacions (js/equacions/nivells.js).
 * DEPENDÈNCIES: js/motor/atzar.js.
 * ============================================================================
 */
import { creaAtzar } from './atzar.js';

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
    return { forma, errades, compensades, anuncia: !noerrors && nivell !== 3 && nivell !== 5 };
}

const COMUNS = {
    1: { index: 'Una errada', errades: 'una errada', detall: 'sense parèntesis' },
    3: { index: 'Una errada, sense dir-ho', errades: 'una errada', detall: 'sense dir-ho' },
    4: { index: 'Dues errades', errades: 'dues errades', detall: '' },
    5: { index: 'Una o dues errades, i sense dir-ho', errades: 'una o dues errades', detall: 'sense dir-ho' },
};
export const NIVELLS = {
    // la forma 2 de les equacions no porta parèntesis (auditoria B2, 28/11/2026)
    equacions: { ...COMUNS, 2: { index: 'Una errada. Equacions més llargues', errades: 'una errada', detall: 'equacions més llargues' } },
    prioritat: { ...COMUNS, 2: { index: 'Una errada. Operació amb parèntesis o potències', errades: 'una errada', detall: 'amb parèntesis o potències' } },
};

/** El text de la capçalera de la pàgina d'una activitat. */
export function capcalera(activitat, nivell, noerrors) {
    const n = NIVELLS[activitat][nivell];
    const parts = noerrors ? [n.detall, 'pot ser que no hi hagi cap errada'] : [[n.errades, n.detall].filter(Boolean).join(', ')];
    return ['Nivell ' + nivell, ...parts.filter(Boolean)].join(' · ');
}
