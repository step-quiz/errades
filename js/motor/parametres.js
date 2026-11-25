/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/motor/parametres.js
 * ROL: Els paràmetres de l'adreça, iguals per a totes les activitats
 *      (equacions.html, prioritat.html) i per a l'índex que fa els enllaços.
 * ARQUITECTURA:
 * - llegeixParametres(cerca) és pur: nivell (1–5, per defecte 1), noerrors (0/1),
 *   escriu (0/1), encercla (0/1; sense el paràmetre, -1 = automàtic),
 *   totaloperations (1–20, per defecte 6), maxintents (1–5, per defecte 3),
 *   llavor (enter ≥ 0; la mateixa llavor dona els mateixos exemples).
 * - encerclaDe(par, tactil): R3, encerclar amb el dit per defecte a les pantalles
 *   tàctils i tocar amb el ratolí, tret que l'adreça digui el contrari.
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */
export function llegeixParametres(cerca) {
    const p = new URLSearchParams(cerca);
    const ent = (k, def, min, max) => {
        const v = Number.parseInt(p.get(k), 10);
        return Number.isInteger(v) && v >= min && v <= max ? v : def;
    };
    const llavor = Number.parseInt(p.get('llavor'), 10);
    return {
        nivell: ent('nivell', 1, 1, 5),
        noerrors: ent('noerrors', 0, 0, 1) === 1,
        escriu: ent('escriu', 0, 0, 1) === 1,
        encercla: p.has('encercla') ? ent('encercla', -1, 0, 1) : -1,
        total: ent('totaloperations', 6, 1, 20),
        maxIntents: ent('maxintents', 3, 1, 5),
        llavor: Number.isInteger(llavor) && llavor >= 0 ? llavor : null,
    };
}

export const encerclaDe = (par, tactil) => (par.encercla === -1 ? !!tactil : par.encercla === 1);

export const esTactil = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

export const llavorNova = () => {
    try {
        return crypto.getRandomValues(new Uint32Array(1))[0];
    } catch (e) {
        return Math.floor(Math.random() * 2 ** 32);
    }
};
