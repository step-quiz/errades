/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/motor/activitat.js
 * ROL: El que fan igual totes les pàgines d'activitat (auditoria 2, C1): llegir
 *      l'adreça, carregar les dades, recuperar la sessió desada, escriure la
 *      capçalera i engegar la sessió. Cada pàgina només diu com és el seu exemple.
 * ARQUITECTURA:
 * - llavorExercici(base, i) = base + i·7919: la llavor de l'exercici i d'una sessió.
 * - exempleGenerat(generador, nivell, noerrors, base, i): l'exemple i-èsim del generador per a aquest
 *   nivell (js/motor/nivells.js), amb llavor llavorExercici(base, i). La primera errada és de la carta
 *   que toca de la baralla de la sessió (una carta per errada), i la segona, si n'hi ha, de les cartes
 *   que vénen després, si es pot (tipusSessio, js/motor/exemple.js; auditoria 2 P2). Si no se'n pot
 *   fer cap amb errades compensades (molt improbable), sense compensar. Pur.
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
import { tipusSessio } from './exemple.js';

export const llavorExercici = (base, i) => (base + i * 7919) >>> 0;

export function exempleGenerat({ generaExemple, perPagina, TIPUS_PER_FORMA }, nivell, noerrors, base, i) {
    const llavor = llavorExercici(base, i);
    const p = parametres(nivell, noerrors, llavor);
    // la carta de cada errada: les errades dels exercicis d'abans ja n'han fet servir
    let k = 0;
    for (let j = 0; j < i; j++) k += parametres(nivell, noerrors, llavorExercici(base, j)).errades;
    const llista = (TIPUS_PER_FORMA && TIPUS_PER_FORMA[p.forma]) || [];
    const tipus = tipusSessio(base, k, llista);
    const prefereix = llista.slice(1).map((t, d) => tipusSessio(base, k + 1 + d, llista));
    // si no surt (molt improbable): sense la carta, i després sense compensar
    const proves = [{ compensades: p.compensades, tipus, prefereix }, { compensades: p.compensades }, { errades: Math.max(1, p.errades) }];
    for (const [n, o] of proves.entries()) {
        try {
            return perPagina(generaExemple({ llavor, nivell: p.forma, errades: p.errades, ...o }));
        } catch (e) {
            if (n === proves.length - 1) throw e;
        }
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
