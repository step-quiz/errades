/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/index.js
 * ROL: El generador d'enllaços de l'índex (per al professorat): l'activitat
 *      (equacions o prioritat d'operacions) i tots els paràmetres, en un sol
 *      panell de desplegables (com l'índex d'operacions).
 * ARQUITECTURA:
 * - enllac(base, valors) i pagina(activitat) són purs (tests/index.test.js).
 * - Paràmetres (els llegeix js/motor/parametres.js): nivell, noerrors, escriu,
 *   encercla (auto = no s'escriu), totaloperations, maxintents, llavor (buida =
 *   no s'escriu), membre (només equacions: membre, costat, banda o part). Els valors
 *   per defecte no s'escriuen, perquè l'enllaç quedi curt.
 * - Les etiquetes dels nivells són curtes; només el 2 canvia amb l'activitat.
 * - Fins que no es tria l'activitat, els paràmetres i l'enllaç són amagats.
 * - «Repartiment» (selector) substitueix el camp de la llavor: «Iguals per a
 *   tothom» genera una llavor (llavorNova) i la deixa només a l'enllaç.
 * DEPENDÈNCIES: js/motor/parametres.js (llavorNova).
 * ============================================================================
 */
import { llavorNova, PARAULES_MEMBRE } from './motor/parametres.js';

export const PER_DEFECTE = { nivell: '1', noerrors: '0', escriu: '0', encercla: 'auto', totaloperations: '6', maxintents: '3', llavor: '', membre: 'membre' };
const LIMITS = { nivell: [1, 5], noerrors: [0, 1], escriu: [0, 1], encercla: [0, 1], totaloperations: [1, 20], maxintents: [1, 5], llavor: [0, 4294967295] };
export const PAGINES = { equacions: 'equacions.html', prioritat: 'prioritat.html' };
export const pagina = activitat => PAGINES[activitat] || PAGINES.equacions;

export const NIVELLS = {
    equacions: {
        1: 'Una errada',
        2: 'Una errada. Equació amb parèntesis',
        3: 'Una errada, sense advertir-ho',
        4: 'Dues errades',
        5: 'Una o dues errades, i sense advertir-ho',
    },
    prioritat: {
        1: 'Una errada',
        2: 'Una errada. Operació amb parèntesis o potències',
        3: 'Una errada, sense advertir-ho',
        4: 'Dues errades',
        5: 'Una o dues errades, i sense advertir-ho',
    },
};

export function enllac(base, valors) {
    const p = new URLSearchParams();
    for (const k of Object.keys(PER_DEFECTE)) {
        const brut = valors[k] === undefined ? '' : String(valors[k]).trim();
        if (k === 'membre') {
            // una paraula, no un nombre: només si és una de les que es poden triar i no és la de per defecte
            if (PARAULES_MEMBRE.includes(brut) && brut !== PER_DEFECTE.membre) p.set(k, brut);
            continue;
        }
        if ((k === 'encercla' && (brut === 'auto' || brut === '')) || (k === 'llavor' && brut === '')) continue;
        const [mn, mx] = LIMITS[k];
        let v = Number.parseInt(brut, 10);
        if (!Number.isInteger(v)) {
            if (k === 'encercla' || k === 'llavor') continue;
            v = Number(PER_DEFECTE[k]);
        }
        v = Math.min(mx, Math.max(mn, v));
        if (String(v) !== PER_DEFECTE[k]) p.set(k, String(v));
    }
    const q = p.toString();
    return base + (q ? '?' + q : '');
}

if (typeof document !== 'undefined') {
    const form = document.getElementById('form-act');
    const params = document.getElementById('act-params');
    const camp = document.getElementById('act-enllac');
    const obre = document.getElementById('act-obre');
    const avis = document.getElementById('act-copiat');
    const selNivell = document.getElementById('act-nivell');
    const filaMembre = document.getElementById('fila-membre');
    let activitat = '';
    let llavor = '';
    let nivellsDe = '';
    const omple = act => {
        if (act === nivellsDe) return;
        const triat = selNivell.value || '1';
        selNivell.replaceChildren(
            ...[1, 2, 3, 4, 5].map(n => {
                const o = document.createElement('option');
                o.value = String(n);
                o.textContent = n + ' · ' + NIVELLS[act][n];
                return o;
            })
        );
        selNivell.value = triat;
        nivellsDe = act;
    };
    const posa = () => {
        const valors = Object.fromEntries(new FormData(form).entries());
        if (!(valors.activitat in PAGINES)) return;
        activitat = valors.activitat;
        params.hidden = false;
        omple(activitat);
        valors.nivell = selNivell.value;
        if (valors.reparteix === '1') {
            if (llavor === '') llavor = String(llavorNova());
        } else llavor = '';
        valors.llavor = llavor;
        // la paraula «membre» només té sentit a les equacions
        filaMembre.hidden = activitat !== 'equacions';
        if (activitat !== 'equacions') delete valors.membre;
        const url = enllac(new URL(pagina(activitat), location.href).href, valors);
        camp.value = url;
        obre.href = url;
        avis.textContent = '';
    };
    form.addEventListener('input', posa);
    form.addEventListener('change', posa);
    form.addEventListener('submit', e => e.preventDefault());
    document.getElementById('act-copia').addEventListener('click', () => {
        const fet = () => (avis.textContent = 'Enllaç copiat.');
        const aMa = () => {
            camp.focus();
            camp.select();
            avis.textContent = 'Selecciona l’enllaç i copia’l (Ctrl+C).';
        };
        try {
            navigator.clipboard.writeText(camp.value).then(fet, aMa);
        } catch (e) {
            aMa();
        }
    });
}
