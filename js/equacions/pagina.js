/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/equacions/pagina.js
 * ROL: Punt d'entrada d'equacions.html: llegeix l'adreça, carrega els tipus
 *      d'errada (data/errors.json) i engega una sessió.
 * ARQUITECTURA:
 * - Paràmetres (docs/SPEC.md §6; etapa 1): nivell (1–2, per defecte 1),
 *   totaloperations (exemples, 1–20, per defecte 6), maxintents (1–5, per
 *   defecte 3), llavor (enter; la mateixa llavor dona els mateixos exemples).
 * - Etapa 1: una errada per exemple, i la consigna diu quantes n'hi ha.
 * DEPENDÈNCIES: js/equacions/generador.js, js/motor/sessio.js, js/motor/estat.js.
 * ============================================================================
 */
import { generaExemple, perPagina } from './generador.js';
import { iniciaSessio } from '../motor/sessio.js';
import { CONFIG_PER_DEFECTE } from '../motor/estat.js';

export function llegeixParametres(cerca) {
    const p = new URLSearchParams(cerca);
    const ent = (k, def, min, max) => {
        const v = Number.parseInt(p.get(k), 10);
        return Number.isInteger(v) && v >= min && v <= max ? v : def;
    };
    const llavor = Number.parseInt(p.get('llavor'), 10);
    return {
        nivell: ent('nivell', 1, 1, 2),
        total: ent('totaloperations', 6, 1, 20),
        maxIntents: ent('maxintents', 3, 1, 5),
        llavor: Number.isInteger(llavor) && llavor >= 0 ? llavor : null,
    };
}

const llavorNova = () => {
    try {
        return crypto.getRandomValues(new Uint32Array(1))[0];
    } catch (e) {
        return Math.floor(Math.random() * 2 ** 32);
    }
};

async function engega() {
    const llibreta = document.getElementById('llibreta');
    const par = llegeixParametres(location.search);
    let tipus;
    try {
        tipus = await (await fetch('data/errors.json')).json();
    } catch (e) {
        llibreta.innerHTML = '<p class="msg noEncert">No s\'ha pogut carregar l\'activitat. Torna-ho a provar d\'aquí a una estona.</p>';
        return;
    }
    let base = par.llavor ?? llavorNova();
    const cfg = { ...CONFIG_PER_DEFECTE, maxIntents: par.maxIntents, anuncia: true };
    if (par.nivell === 2) document.getElementById('nivell').textContent = 'Nivell 2 · amb parèntesis';
    iniciaSessio({
        llibreta,
        progres: document.getElementById('progres'),
        final: document.getElementById('final'),
        total: par.total,
        cfg,
        exemple: i => perPagina(generaExemple({ llavor: (base + i * 7919) >>> 0, nivell: par.nivell, errades: 1 }, tipus)),
        onNova: () => {
            base = llavorNova();
        },
    });
}

if (typeof document !== 'undefined') engega();
