/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/equacions/pagina.js
 * ROL: Punt d'entrada d'equacions.html: llegeix l'adreça, carrega els tipus
 *      d'errada i el banc, i engega una sessió.
 * ARQUITECTURA:
 * - Paràmetres (docs/SPEC.md §6): nivell (1–5, per defecte 1), noerrors (0/1),
 *   escriu (0/1: a «Corregeix-la» l'alumne escriu el terme encerclat en lloc de triar),
 *   totaloperations (exemples, 1–20, per defecte 6), maxintents (1–5, per
 *   defecte 3), llavor (enter; la mateixa llavor dona els mateixos exemples).
 * - Què vol dir cada nivell: js/equacions/nivells.js.
 * - Banc (R6): més o menys 1 exemple de cada 3 surt de data/banc.json, si n'hi
 *   ha cap que encaixi amb el nivell; la resta, del generador.
 * DEPENDÈNCIES: generador.js, nivells.js, js/motor/sessio.js, js/motor/estat.js.
 * ============================================================================
 */
import { generaExemple, perPagina, creaAtzar } from './generador.js';
import { parametres, encaixaBanc, NIVELLS, PROPORCIO_BANC } from './nivells.js';
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
        nivell: ent('nivell', 1, 1, 5),
        noerrors: ent('noerrors', 0, 0, 1) === 1,
        escriu: ent('escriu', 0, 0, 1) === 1,
        total: ent('totaloperations', 6, 1, 20),
        maxIntents: ent('maxintents', 3, 1, 5),
        llavor: Number.isInteger(llavor) && llavor >= 0 ? llavor : null,
    };
}

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
    const cfg = { ...CONFIG_PER_DEFECTE, maxIntents: par.maxIntents, anuncia: sessio.anuncia, terme: sessio.terme, escriu: par.escriu };
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
