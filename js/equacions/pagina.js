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
 *   ha cap que encaixi amb el nivell; la resta, del generador. Dins d'una sessió,
 *   cap exemple del banc no es repeteix fins que no han sortit tots (auditoria E1),
 *   i les seves opcions es barregen amb la llavor de l'exercici.
 * - «membre» (paràmetre de l'adreça): la paraula de les frases de «Per què?»
 *   (exempleAmbParaula, frases.js), per als exemples generats i els del banc.
 * DEPENDÈNCIES: generador.js, frases.js, nivells.js, js/motor/sessio.js, js/motor/estat.js, js/motor/parametres.js.
 * ============================================================================
 */
import { generaExemple, perPagina, creaAtzar } from './generador.js';
import { exempleAmbParaula } from './frases.js';
import { encaixaBanc, NIVELLS, PROPORCIO_BANC } from './nivells.js';
import { parametres } from '../motor/nivells.js';
import { barreja } from '../motor/atzar.js';
import { iniciaSessio, clauSessio, llegeixDesat } from '../motor/sessio.js';
import { CONFIG_PER_DEFECTE } from '../motor/estat.js';
import { llegeixParametres, encerclaDe, esTactil, llavorNova } from '../motor/parametres.js';

export { llegeixParametres };

/** L'exemple i-èsim d'una sessió: del banc o del generador (pur, per a les proves). */
export function exempleSessio(i, { base, nivell, noerrors, tipus, banc, membre = 'membre' }) {
    return exempleAmbParaula(exempleBrut(i, { base, nivell, noerrors, tipus, banc }), membre);
}
/** L'atzar de l'exercici i: el primer valor decideix si surt del banc (R6). */
const atzarExercici = (base, i) => creaAtzar((((base + i * 7919) >>> 0) ^ 0x5bd1e995) >>> 0);
/**
 * Els exemples del banc d'una sessió no es repeteixen (auditoria E1, 28/11/2026): la k-èsima vegada que un exercici
 * surt del banc, agafa la posició k d'una permutació del banc feta amb la llavor de la sessió. Només si el banc
 * s'acaba es torna a començar, amb una altra permutació. Les opcions es barregen amb la llavor de l'exercici.
 */
function delBancSessio(i, base, delBanc) {
    let k = 0;
    for (let j = 0; j < i; j++) if (atzarExercici(base, j)() < PROPORCIO_BANC) k++;
    const volta = Math.floor(k / delBanc.length);
    const ordre = barreja(creaAtzar(((base ^ 0x2c1b3c6d) + volta * 104729) >>> 0), delBanc);
    const ex = ordre[k % delBanc.length];
    const r = creaAtzar(((base + i * 7919) ^ 0x68e31da4) >>> 0);
    const errades = {};
    for (const [j, e] of Object.entries(ex.errades || {})) errades[j] = { ...e, perque: barreja(r, e.perque), opcions: barreja(r, e.opcions) };
    return { ...ex, errades };
}
function exempleBrut(i, { base, nivell, noerrors, tipus, banc }) {
    const llavor = (base + i * 7919) >>> 0;
    const delBanc = banc.filter(b => encaixaBanc(b, nivell, noerrors));
    if (delBanc.length && atzarExercici(base, i)() < PROPORCIO_BANC) return delBancSessio(i, base, delBanc);
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
    // una sessió desada d'aquesta mateixa adreça continua on era, amb la mateixa llavor (auditoria E2)
    const clau = clauSessio(),
        desat = llegeixDesat(clau);
    let base = desat && Number.isInteger(desat.llavor) ? desat.llavor : par.llavor ?? llavorNova();
    const sessio = parametres(par.nivell, par.noerrors, 0);
    const encercla = encerclaDe(par, esTactil());
    const cfg = { ...CONFIG_PER_DEFECTE, activitat: 'equacions', maxIntents: par.maxIntents, anuncia: sessio.anuncia, escriu: par.escriu, encercla, nota: par.nota };
    document.getElementById('nivell').textContent = `Nivell ${par.nivell} · ${NIVELLS[par.nivell]}${par.noerrors ? ' · pot ser que no n\'hi hagi cap' : ''}`;
    iniciaSessio({
        llibreta,
        progres: document.getElementById('progres'),
        final: document.getElementById('final'),
        total: par.total,
        cfg,
        exemple: i => exempleSessio(i, { base, nivell: par.nivell, noerrors: par.noerrors, tipus, banc, membre: par.membre }),
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

// Només un cop i només a equacions.html (les proves importen aquest mòdul sense engegar res)
if (typeof document !== 'undefined' && document.getElementById('llibreta') && !window.__erradesEngegat) {
    window.__erradesEngegat = true;
    engega();
}
