/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/motor/exemple.js
 * ROL: El que tenen en comú els exemples de les dues activitats: les opcions de
 *      «Per què és una errada?».
 * ARQUITECTURA:
 * - DISTRACTORS_PERQUE: quantes frases falses acompanyen la bona (el David,
 *   28/11/2026: la bona i 2 distractors).
 * - opcionsPerque(r, bona, dolentes) → [[text, true|false], …]: la bona i
 *   DISTRACTORS_PERQUE distractors triats a l'atzar, en un ordre a l'atzar.
 *   Els generadors i eines/frases-editor/banc.mjs la fan servir; valida() de
 *   cada generador comprova que n'hi hagi DISTRACTORS_PERQUE + 1, totes diferents.
 * DEPENDÈNCIES: js/motor/atzar.js.
 * ============================================================================
 */
import { barreja } from './atzar.js';

export const DISTRACTORS_PERQUE = 2;

export const opcionsPerque = (r, bona, dolentes) => barreja(r, [[bona, true], ...barreja(r, dolentes).slice(0, DISTRACTORS_PERQUE).map(t => [t, false])]);
