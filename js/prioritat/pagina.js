/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/prioritat/pagina.js
 * ROL: Punt d'entrada de prioritat.html: llegeix l'adreça i engega una sessió
 *      d'exemples de prioritat d'operacions.
 * ARQUITECTURA:
 * - Paràmetres: js/motor/parametres.js (els mateixos que les equacions).
 * - Nivells: els de js/equacions/nivells.js (quantes errades, si es diu quantes
 *   n'hi ha, fase del terme); la forma 1 (nivell 1) és sense parèntesis ni
 *   potències, i la forma 2 (nivells 2–5) en té.
 * - No hi ha banc: tots els exemples surten del generador.
 * DEPENDÈNCIES: generador.js, js/equacions/nivells.js, js/motor/*.
 * ============================================================================
 */
import { generaExemple, perPagina } from './generador.js';
import { parametres } from '../equacions/nivells.js';
import { iniciaSessio } from '../motor/sessio.js';
import { CONFIG_PER_DEFECTE } from '../motor/estat.js';
import { llegeixParametres, encerclaDe, esTactil, llavorNova } from '../motor/parametres.js';

export const NIVELLS = {
    1: 'una errada, sense parèntesis',
    2: 'una errada, amb parèntesis i potències',
    3: 'una errada, sense dir-ho',
    4: 'dues errades i el terme equivocat',
    5: 'una o dues errades, sense dir-ho',
};

/** L'exemple i-èsim d'una sessió (pur, per a les proves). */
export function exempleSessio(i, { base, nivell, noerrors }) {
    const llavor = (base + i * 7919) >>> 0;
    const p = parametres(nivell, noerrors, llavor);
    try {
        return perPagina(generaExemple({ llavor, nivell: p.forma, errades: p.errades, compensades: p.compensades }));
    } catch (e) {
        // molt improbable: sense errades compensades
        return perPagina(generaExemple({ llavor, nivell: p.forma, errades: Math.max(1, p.errades) }));
    }
}

function engega() {
    const par = llegeixParametres(location.search);
    let base = par.llavor ?? llavorNova();
    const sessio = parametres(par.nivell, par.noerrors, 0);
    const cfg = {
        ...CONFIG_PER_DEFECTE,
        activitat: 'prioritat',
        maxIntents: par.maxIntents,
        anuncia: sessio.anuncia,
        terme: sessio.terme,
        escriu: par.escriu,
        encercla: encerclaDe(par, esTactil()),
    };
    document.getElementById('nivell').textContent = `Nivell ${par.nivell} · ${NIVELLS[par.nivell]}${par.noerrors ? " · pot ser que no n'hi hagi cap" : ''}`;
    iniciaSessio({
        llibreta: document.getElementById('llibreta'),
        progres: document.getElementById('progres'),
        final: document.getElementById('final'),
        total: par.total,
        cfg,
        exemple: i => exempleSessio(i, { base, nivell: par.nivell, noerrors: par.noerrors }),
        onNova: () => {
            base = llavorNova();
        },
    });
}

// Només un cop i només a prioritat.html (les proves importen aquest mòdul sense engegar res)
if (typeof document !== 'undefined' && document.getElementById('llibreta') && !window.__erradesEngegat) {
    window.__erradesEngegat = true;
    engega();
}
