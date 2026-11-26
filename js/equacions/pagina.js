/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/equacions/pagina.js
 * ROL: Punt d'entrada d'equacions.html: llegeix l'adreça, carrega els tipus
 *      d'errada i el banc, i engega una sessió.
 * ARQUITECTURA:
 * - Paràmetres: js/motor/parametres.js (comuns a les dues activitats).
 * - Què vol dir cada nivell: js/equacions/nivells.js.
 * - Banc (R6): més o menys 1 exemple de cada 3 surt de data/banc.json, si n'hi
 *   ha cap que encaixi amb el nivell; la resta, del generador.
 * DEPENDÈNCIES: generador.js, nivells.js, js/motor/sessio.js, js/motor/estat.js, js/motor/parametres.js.
 * ============================================================================
 */
import { generaExemple, perPagina, creaAtzar } from './generador.js';
import { parametres, encaixaBanc, NIVELLS, PROPORCIO_BANC } from './nivells.js';
import { iniciaSessio } from '../motor/sessio.js';
import { CONFIG_PER_DEFECTE } from '../motor/estat.js';
import { llegeixParametres, encerclaDe, esTactil, llavorNova } from '../motor/parametres.js';

export { llegeixParametres };

/** L'exemple i-èsim d'una sessió: del banc o del generador (pur, per a les proves). */
export function exempleSessio(i, { base, nivell, noerrors, tipus, banc }) {
    const llavor = (base + i * 7919) >>> 0;
    const r = creaAtzar((llavor ^ 0x5bd1e995) >>> 0);
    const delBanc = banc.filter(b => encaixaBanc(b, nivell, noerrors));
    if (delBanc.length && r() < PROPORCIO_BANC) return delBanc[Math.floor(r() * delBanc.length)];
    const p = parametres(nivell, noerrors, llavor);
    try {
        return perPagina(generaExemple({ llavor, nivell: p.forma, errades: p.errades, compensades: p.compensades }, tipus));
    } catch (e) {
        // molt improbable: sense errades compensades
        return perPagina(generaExemple({ llavor, nivell: p.forma, errades: Math.max(1, p.errades) }, tipus));
    }
}

async function engega() {
    const llibreta = document.getElementById('llibreta');
    const par = llegeixParametres(location.search);
    let tipus,
        banc = [];
    try {
        tipus = await (await fetch('data/errors.json')).json();
    } catch (e) {
        llibreta.innerHTML = '<p class="msg noEncert">No s\'ha pogut carregar l\'activitat. Torna-ho a provar d\'aquí a una estona.</p>';
        return;
    }
    try {
        const b = await (await fetch('data/banc.json')).json();
        if (Array.isArray(b.exemples)) banc = b.exemples;
    } catch (e) {
        banc = [];
    }
    let base = par.llavor ?? llavorNova();
    const sessio = parametres(par.nivell, par.noerrors, 0);
    const encercla = encerclaDe(par, esTactil());
    const cfg = { ...CONFIG_PER_DEFECTE, activitat: 'equacions', maxIntents: par.maxIntents, anuncia: sessio.anuncia, escriu: par.escriu, encercla };
    document.getElementById('nivell').textContent = `Nivell ${par.nivell} · ${NIVELLS[par.nivell]}${par.noerrors ? ' · pot ser que no n\'hi hagi cap' : ''}`;
    iniciaSessio({
        llibreta,
        progres: document.getElementById('progres'),
        final: document.getElementById('final'),
        total: par.total,
        cfg,
        exemple: i => exempleSessio(i, { base, nivell: par.nivell, noerrors: par.noerrors, tipus, banc }),
        onNova: () => {
            base = llavorNova();
        },
    });
}

// Només un cop i només a equacions.html (les proves importen aquest mòdul sense engegar res)
if (typeof document !== 'undefined' && document.getElementById('llibreta') && !window.__erradesEngegat) {
    window.__erradesEngegat = true;
    engega();
}
