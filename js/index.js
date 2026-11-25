/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/index.js
 * ROL: El generador d'enllaços de l'índex (per al professorat): l'activitat
 *      (equacions o prioritat d'operacions) i tots els paràmetres.
 * ARQUITECTURA:
 * - enllac(base, valors) i pagina(activitat) són purs (tests/index.test.js).
 * - Paràmetres (els llegeix js/motor/parametres.js): nivell, noerrors, escriu,
 *   encercla (auto = no s'escriu), totaloperations, maxintents, llavor (buida =
 *   no s'escriu). Els valors per defecte no s'escriuen, perquè l'enllaç quedi curt.
 * - Les descripcions dels nivells canvien amb l'activitat.
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */
export const PER_DEFECTE = { nivell: '1', noerrors: '0', escriu: '0', encercla: 'auto', totaloperations: '6', maxintents: '3', llavor: '' };
const LIMITS = { nivell: [1, 5], noerrors: [0, 1], escriu: [0, 1], encercla: [0, 1], totaloperations: [1, 20], maxintents: [1, 5], llavor: [0, 4294967295] };
export const PAGINES = { equacions: 'equacions.html', prioritat: 'prioritat.html' };
export const pagina = activitat => PAGINES[activitat] || PAGINES.equacions;

export const NIVELLS = {
    equacions: {
        1: 'una errada, sense parèntesis, 4–6 línies',
        2: 'una errada, amb parèntesis, 6–8 línies',
        3: "una errada, però no es diu quantes n'hi ha",
        4: 'dues errades; cal marcar també el terme equivocat',
        5: 'una o dues, sense dir-ho; de vegades es compensen',
    },
    prioritat: {
        1: 'una errada, sense parèntesis ni potències (+ − · :)',
        2: 'una errada, amb parèntesis, potències i nombres negatius',
        3: "una errada, però no es diu quantes n'hi ha",
        4: 'dues errades; cal marcar també el terme equivocat',
        5: 'una o dues, sense dir-ho; de vegades es compensen',
    },
};

export function enllac(base, valors) {
    const p = new URLSearchParams();
    for (const k of Object.keys(PER_DEFECTE)) {
        const brut = valors[k] === undefined ? '' : String(valors[k]).trim();
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
    const camp = document.getElementById('act-enllac');
    const obre = document.getElementById('act-obre');
    const avis = document.getElementById('act-copiat');
    const posa = () => {
        const valors = Object.fromEntries(new FormData(form).entries());
        const act = valors.activitat in PAGINES ? valors.activitat : 'equacions';
        document.querySelectorAll('[data-niv]').forEach(el => (el.textContent = NIVELLS[act][el.dataset.niv]));
        document.querySelectorAll('.mostra[data-act]').forEach(el => (el.hidden = el.dataset.act !== act));
        const url = enllac(new URL(pagina(act), location.href).href, valors);
        camp.value = url;
        obre.href = url;
        avis.textContent = '';
    };
    form.addEventListener('input', posa);
    form.addEventListener('change', posa);
    form.addEventListener('submit', e => e.preventDefault());
    document.getElementById('act-copia').addEventListener('click', () => {
        const fet = () => (avis.textContent = 'Copiat.');
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
    posa();
}
