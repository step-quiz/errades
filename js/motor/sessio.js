/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/motor/sessio.js
 * ROL: Una sessió de N exemples: el comptador de dalt, la franja «Següent» del
 *      final de cada exemple (fitxer comú) i la pantalla final amb la nota.
 * ARQUITECTURA:
 * - iniciaSessio({ llibreta, progres, final, total, exemple, cfg }) on
 *   exemple(i) torna l'exemple i-èsim (0, 1, …) del generador de l'activitat.
 * - Cada exemple s'acaba amb mostraSeguent() de js/comu/seguent.js: la
 *   llibreta es queda a la vista fins que l'alumne prem «Següent» (o Enter).
 * - Nota final sobre 10: punts / (10 · N) · 10, amb coma decimal.
 * - Sense codi de verificació (etapa 3).
 * DEPENDÈNCIES: js/motor/llibreta.js, js/comu/seguent.js, js/comu/punts.js.
 * ============================================================================
 */
import { creaLlibreta } from './llibreta.js';
import { mostraSeguent, amagaSeguent, textPunts } from '../comu/seguent.js';
import { PUNTS_MAX } from '../comu/punts.js';

export const nota = (punts, total) => (total ? Math.round((punts / (PUNTS_MAX * total)) * 100) / 10 : 0);
export const notaTxt = v => String(v).replace('.', ',');

export function iniciaSessio({ llibreta, progres, final, total, exemple, cfg, onNova }) {
    const resultats = [];
    let actual = null,
        index = 0;

    function posaProgres() {
        const fets = resultats.reduce((s, r) => s + r, 0);
        progres.textContent = `Exemple ${index + 1} de ${total} · ${textPunts(fets).replace('+', '')}`;
    }

    function obre(i) {
        if (actual) actual.destrueix();
        final.hidden = true;
        llibreta.hidden = false;
        const ex = exemple(i);
        index = i;
        posaProgres();
        actual = creaLlibreta(llibreta, ex, cfg, {
            onAcaba(p) {
                resultats.push(p);
                posaProgres();
                const ultima = resultats.length >= total;
                mostraSeguent({
                    punts: p,
                    encert: p > 0,
                    ultima,
                    lloc: llibreta.parentElement,
                    titol: p > 0 ? 'Molt bé!' : "T'he ensenyat l'errada",
                    onSeguent: () => (ultima ? acaba() : obre(i + 1)),
                });
            },
        });
        // A partir del segon exemple (després de «Següent»), el focus va a la llibreta per poder seguir amb el
        // teclat; al primer no, perquè el navegador no hi dibuixi el contorn de focus en obrir la pàgina.
        if (i > 0) {
            llibreta.focus({ preventScroll: true });
            llibreta.scrollIntoView({ block: 'nearest' });
        }
    }

    function acaba() {
        if (actual) actual.destrueix();
        actual = null;
        amagaSeguent();
        llibreta.hidden = true;
        const fets = resultats.reduce((s, r) => s + r, 0);
        const v = nota(fets, total);
        progres.textContent = `Has acabat · ${fets} de ${PUNTS_MAX * total} punts`;
        final.hidden = false;
        final.innerHTML = `<h2>Has acabat!</h2>
<p class="nota"><span>Nota</span><strong>${notaTxt(v)}</strong></p>
<p>${fets} punts de ${PUNTS_MAX * total} possibles.</p>
<ol class="resum">${resultats.map((p, i) => `<li><span>Exemple ${i + 1}</span><span>${textPunts(p).replace('+', '')}</span></li>`).join('')}</ol>
<div class="acc"><button type="button" class="b pri" id="torna">Torna a començar</button><a class="b" href="index.html">Tria una altra activitat</a></div>`;
        final.querySelector('#torna').addEventListener('click', () => {
            resultats.length = 0;
            if (typeof onNova === 'function') onNova();
            obre(0);
        });
        final.querySelector('#torna').focus({ preventScroll: true });
    }

    obre(0);
    return { resultats };
}
