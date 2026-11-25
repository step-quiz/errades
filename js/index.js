/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/index.js
 * ROL: El generador d'enllaços de l'índex (per al professorat).
 * ARQUITECTURA:
 * - enllac(base, valors) és pur (es prova a tests/index.test.js).
 * - Els valors per defecte (nivell 1, 6 exemples, 3 intents) no s'escriuen a
 *   l'enllaç, perquè quedi curt.
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */
export const PER_DEFECTE = { nivell: '1', noerrors: '0', escriu: '0', totaloperations: '6', maxintents: '3' };
const LIMITS = { nivell: [1, 5], noerrors: [0, 1], escriu: [0, 1], totaloperations: [1, 20], maxintents: [1, 5] };

export function enllac(base, valors) {
    const p = new URLSearchParams();
    for (const k of Object.keys(PER_DEFECTE)) {
        const [mn, mx] = LIMITS[k];
        let v = Number.parseInt(valors[k], 10);
        if (!Number.isInteger(v)) v = Number(PER_DEFECTE[k]);
        v = Math.min(mx, Math.max(mn, v));
        if (String(v) !== PER_DEFECTE[k]) p.set(k, String(v));
    }
    const q = p.toString();
    return base + (q ? '?' + q : '');
}

if (typeof document !== 'undefined') {
    const form = document.getElementById('form-eq');
    const camp = document.getElementById('eq-enllac');
    const obre = document.getElementById('eq-obre');
    const avis = document.getElementById('eq-copiat');
    const base = new URL('equacions.html', location.href).href;
    const posa = () => {
        const f = new FormData(form);
        const url = enllac(base, Object.fromEntries(f.entries()));
        camp.value = url;
        obre.href = url;
        avis.textContent = '';
    };
    form.addEventListener('input', posa);
    form.addEventListener('submit', e => e.preventDefault());
    document.getElementById('eq-copia').addEventListener('click', () => {
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
