/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/motor/activitat.js
 * ROL: El que fan igual totes les pàgines d'activitat (auditoria 2, C1): llegir
 *      l'adreça, carregar les dades, recuperar la sessió desada, escriure la
 *      capçalera i engegar la sessió. Cada pàgina només diu com és el seu exemple.
 * ARQUITECTURA:
 * - llavorExercici(base, i) = base + i·7919: la llavor de l'exercici i d'una sessió.
 * - exempleGenerat(generador, nivell, noerrors, llavor): un exemple del generador per a aquest
 *   nivell (js/motor/nivells.js); si no se'n pot fer cap amb errades compensades (molt
 *   improbable), sense compensar. Pur.
 * - engega({ activitat, taxonomia, dades, exemple }): taxonomia és el JSON dels tipus d'errada
 *   (els noms de l'informe final); dades, altres JSON opcionals ({ banc: 'data/banc.json' }).
 *   Tot s'espera abans de començar (abans, la prioritat no esperava la taxonomia i l'informe
 *   podia sortir sense noms). Si un fitxer no es pot carregar, val null i l'activitat continua.
 *   exemple(i, { base, par, dades }) torna l'exemple i-èsim.
 * - Només s'engega un cop i només en una pàgina amb #llibreta (les proves importen les pàgines).
 * DEPENDÈNCIES: js/motor/sessio.js, js/motor/estat.js, js/motor/parametres.js, js/motor/nivells.js.
 * ============================================================================
 */
import { iniciaSessio, clauSessio, llegeixDesat } from './sessio.js';
import { CONFIG_PER_DEFECTE } from './estat.js';
import { llegeixParametres, encerclaDe, esTactil, llavorNova } from './parametres.js';
import { parametres, capcalera } from './nivells.js';

export const llavorExercici = (base, i) => (base + i * 7919) >>> 0;

export function exempleGenerat({ generaExemple, perPagina }, nivell, noerrors, llavor) {
    const p = parametres(nivell, noerrors, llavor);
    try {
        return perPagina(generaExemple({ llavor, nivell: p.forma, errades: p.errades, compensades: p.compensades }));
    } catch (e) {
        return perPagina(generaExemple({ llavor, nivell: p.forma, errades: Math.max(1, p.errades) }));
    }
}

const carrega = async url => {
    try {
        return await (await fetch(url)).json();
    } catch (e) {
        return null;
    }
};

export async function engega({ activitat, taxonomia, dades = {}, exemple }) {
    if (typeof document === 'undefined' || !document.getElementById('llibreta') || window.__erradesEngegat) return;
    window.__erradesEngegat = true;
    const par = llegeixParametres(location.search);
    const noms = Object.keys(dades);
    const [tipus, ...extres] = await Promise.all([carrega(taxonomia), ...noms.map(k => carrega(dades[k]))]);
    const carregades = Object.fromEntries(noms.map((k, n) => [k, extres[n]]));
    // una sessió desada d'aquesta mateixa adreça continua on era, amb la mateixa llavor (auditoria E2)
    const clau = clauSessio(),
        desat = llegeixDesat(clau);
    let base = desat && Number.isInteger(desat.llavor) ? desat.llavor : par.llavor ?? llavorNova();
    const cfg = {
        ...CONFIG_PER_DEFECTE,
        activitat,
        maxIntents: par.maxIntents,
        anuncia: parametres(par.nivell, par.noerrors, 0).anuncia,
        escriu: par.escriu,
        encercla: encerclaDe(par, esTactil()),
        nota: par.nota,
    };
    document.getElementById('nivell').textContent = capcalera(activitat, par.nivell, par.noerrors);
    iniciaSessio({
        llibreta: document.getElementById('llibreta'),
        progres: document.getElementById('progres'),
        final: document.getElementById('final'),
        total: par.total,
        cfg,
        exemple: i => exemple(i, { base, par, dades: carregades }),
        onNova: () => {
            base = llavorNova();
        },
        clau,
        llavor: () => base,
        desat,
        // el nom de cada tipus d'errada, per a l'informe de la pantalla final (E3)
        nomTipus: t => (tipus && tipus[t] && tipus[t].nom) || '',
    });
}
