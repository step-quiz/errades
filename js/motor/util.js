/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/motor/util.js
 * ROL: Petites eines que fan servir diversos mòduls (auditoria 2, C4).
 * ARQUITECTURA:
 * - esc(s): text segur dins d'HTML.
 * - menys(n): un enter amb el signe menys tipogràfic (−3).
 * - llista(xs, buit): «a, b i c» (buit si la llista és buida).
 * - esTactil(): hi ha algun punter tàctil (any-pointer: coarse): un Chromebook tàctil en mode
 *   portàtil també ho és (auditoria T4). Decideix el llaç i el teclat de la pàgina.
 * - puntPrincipalTactil(): el punter principal és tàctil (pointer: coarse). Només per no posar
 *   el focus al camp d'escriure, que obriria el teclat del sistema.
 * DEPENDÈNCIES: cap.
 * ============================================================================
 */
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const menys = n => (n < 0 ? '−' + Math.abs(n) : String(n));
export const llista = (xs, buit) => (xs.length > 1 ? xs.slice(0, -1).join(', ') + ' i ' + xs[xs.length - 1] : xs.length ? xs[0] : buit);
const coincideix = q => typeof matchMedia === 'function' && matchMedia(q).matches;
export const esTactil = () => coincideix('(any-pointer: coarse)');
export const puntPrincipalTactil = () => coincideix('(pointer: coarse)');
