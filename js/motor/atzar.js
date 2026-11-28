/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/motor/atzar.js
 * ROL: L'atzar sembrat de les dues activitats: la mateixa llavor dona sempre
 *      els mateixos nombres (sessions reproduïbles amb el paràmetre llavor).
 * ARQUITECTURA:
 * - creaAtzar(llavor) → r(), un generador mulberry32 amb valors a [0, 1).
 * - enter(r, a, b), tria(r, llista), barreja(r, llista) (Fisher–Yates, no toca
 *   la llista original) i signe(r) (−1 o +1).
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */
export function creaAtzar(llavor) {
    let a = llavor >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
export const enter = (r, a, b) => a + Math.floor(r() * (b - a + 1));
export const tria = (r, llista) => llista[Math.floor(r() * llista.length)];
export const signe = r => (r() < 0.5 ? -1 : 1);
export function barreja(r, llista) {
    const a = llista.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
