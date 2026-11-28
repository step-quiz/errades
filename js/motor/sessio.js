/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/motor/sessio.js
 * ROL: Una sessió de N exemples: el comptador de dalt, la franja «Següent» del
 *      final de cada exemple (fitxer comú) i la pantalla final amb la nota.
 * ARQUITECTURA:
 * - iniciaSessio({ llibreta, progres, final, total, exemple, cfg }) on
 *   exemple(i) torna l'exemple i-èsim (0, 1, …) del generador de l'activitat.
 * - Cada exemple (un «exercici», auditoria C11) s'acaba amb mostraSeguent() de
 *   js/comu/seguent.js, amb el títol «Exercici finalitzat» i els punts (C4): la
 *   llibreta es queda a la vista fins que l'alumne prem «Següent» (o Enter).
 * - Nota final sobre 10: punts / (10 · N) · 10, amb coma decimal.
 * - Progrés (auditoria D2): un punt per exercici a la capçalera (fets plens, el d'ara
 *   amb un anell) i els punts guanyats; el text «Exercici n de N» només per al lector
 *   de pantalla.
 * - Sessió desada (auditoria E2): a cada canvi, la llavor, l'exercici, els resultats i
 *   l'estat de l'exercici a mig fer van a localStorage (clau = la pàgina i els
 *   paràmetres de l'adreça), vàlids 12 hores. En tornar a obrir la mateixa adreça
 *   (recarregar, pestanya descartada o tancada), es continua on era; també la
 *   pantalla final. «Torna a començar» l'esborra. Cap dada personal.
 * - Pantalla final com la d'operacions (auditoria E3, el David, 28/11/2026): «Resum»,
 *   una línia per exercici amb els punts, «La nota és: 7,5 / 10», el trofeu i els
 *   botons «📋 Informe» i «🔄 Tornar a jugar» (amb confirmació). L'informe: els
 *   encerts (10 punts) i les errades, cada exercici amb l'enunciat i, de cada errada,
 *   el tipus (nomTipus), la línia equivocada i la bona. Colors R1: lila i gris, mai
 *   verd ni vermell; la línia bona, amb la lletra i el bolígraf del professor. Sense
 *   «Copiar codi» (el codi de verificació és l'etapa 3 del projecte). Cap enllaç a
 *   l'índex (E1: és del professorat).
 * - Sense codi de verificació (etapa 3).
 * DEPENDÈNCIES: js/motor/llibreta.js, js/comu/seguent.js, js/comu/punts.js.
 * ============================================================================
 */
import { creaLlibreta, fm } from './llibreta.js';
import { mostraSeguent, amagaSeguent, textPunts } from '../comu/seguent.js';
import { PUNTS_MAX } from '../comu/punts.js';

export const nota = (punts, total) => (total ? Math.round((punts / (PUNTS_MAX * total)) * 100) / 10 : 0);
export const notaTxt = v => String(v).replace('.', ',');

/** Quant de temps val una sessió desada (una jornada d'escola). */
export const VIGENCIA_MS = 12 * 3600 * 1000;
/** La clau de la sessió desada: la pàgina (sense «.html», que Cloudflare treu) i els paràmetres de l'adreça. */
export const clauSessio = (loc = location) => 'errades-sessio:' + loc.pathname.replace(/\.html$/, '') + loc.search;
/** La sessió desada amb aquesta clau, si n'hi ha i encara val; si no, null. */
export function llegeixDesat(clau, ara = Date.now()) {
    try {
        const d = JSON.parse(localStorage.getItem(clau) || 'null');
        if (!d || d.v !== 1 || !(ara - d.t < VIGENCIA_MS) || !Array.isArray(d.resultats)) return null;
        return d;
    } catch (e) {
        return null;
    }
}
function desa(clau, dades) {
    if (!clau) return;
    try {
        localStorage.setItem(clau, JSON.stringify({ ...dades, v: 1, t: Date.now() }));
    } catch (e) {
        /* sense localStorage (o ple): la sessió continua igual, sense desar */
    }
}
function esborra(clau) {
    try {
        if (clau) localStorage.removeItem(clau);
    } catch (e) {
        /* res */
    }
}

/**
 * clau: on es desa la sessió (null: no es desa); llavor(): la llavor dels exemples, que també es desa;
 * desat: la sessió desada que s'ha de continuar (llegeixDesat), o null.
 */
export function iniciaSessio({ llibreta, progres, final, total, exemple, cfg, onNova, clau = null, llavor = () => null, desat = null, nomTipus = () => '' }) {
    const resultats = desat ? desat.resultats.slice(0, total) : [];
    let actual = null,
        index = 0;

    /** Els punts de progrés (D2): un per exercici, i els punts guanyats; el text sencer, per al lector de pantalla. */
    function posaProgres(acabada = false) {
        const fets = resultats.reduce((s, r) => s + r, 0);
        const pp = Array.from({ length: total }, (_, k) =>
            k < resultats.length ? `<i class="fet${resultats[k] === 0 ? ' zero' : ''}"></i>` : k === index && !acabada ? '<i class="ara"></i>' : '<i></i>'
        ).join('');
        const llegit = acabada ? `Activitat finalitzada · ${fets} de ${PUNTS_MAX * total} punts` : `Exercici ${index + 1} de ${total} · ${textPunts(fets).replace('+', '')}`;
        const vist = acabada ? `${fets} de ${PUNTS_MAX * total} punts` : textPunts(fets).replace('+', '');
        progres.innerHTML = `<span class="vh">${llegit}</span><span aria-hidden="true"><span class="pp">${pp}</span> · ${vist}</span>`;
    }

    function obre(i, estat = null) {
        if (actual) actual.destrueix();
        final.hidden = true;
        llibreta.hidden = false;
        const ex = exemple(i);
        index = i;
        posaProgres();
        actual = creaLlibreta(llibreta, ex, cfg, {
            estat,
            onAcaba(p) {
                // (en continuar una sessió desada amb l'exercici ja acabat, el resultat ja hi és)
                if (resultats.length <= i) resultats.push(p);
                posaProgres();
                const ultima = resultats.length >= total;
                mostraSeguent({
                    punts: p,
                    encert: p > 0,
                    ultima,
                    lloc: llibreta.parentElement,
                    // sempre el mateix títol: els punts ja diuen com ha anat (auditoria C4, el David, 28/11/2026)
                    titol: 'Exercici finalitzat',
                    onSeguent: () => (ultima ? acaba() : obre(i + 1)),
                });
            },
            onCanvi: S => desa(clau, { llavor: llavor(), i, resultats, S }),
        });
        // A partir del segon exemple (després de «Següent»), el focus va a la llibreta per poder seguir amb el
        // teclat; al primer no, perquè el navegador no hi dibuixi el contorn de focus en obrir la pàgina.
        if (i > 0 && !estat) {
            llibreta.focus({ preventScroll: true });
            llibreta.scrollIntoView({ block: 'nearest' });
        }
    }

    const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    const lin = L => (Array.isArray(L) ? L.join(' ') : String(L));

    /** «Tornar a jugar», com a operacions: amb confirmació (la sessió desada s'esborra). */
    function tornaAJugar() {
        if (typeof confirm === 'function' && !confirm('Segur que vols tornar a començar?')) return;
        resultats.length = 0;
        esborra(clau);
        if (typeof onNova === 'function') onNova();
        obre(0);
    }
    const botons = (ambInforme = true) =>
        `<div class="acc final-acc">${ambInforme ? '<button type="button" class="b pri" id="informe">📋 Informe</button>' : ''}<button type="button" class="b" id="torna">🔄 Tornar a jugar</button></div>`;
    function lligaBotons() {
        const inf = final.querySelector('#informe');
        if (inf) inf.addEventListener('click', informe);
        final.querySelector('#torna').addEventListener('click', tornaAJugar);
    }

    /** Un exercici a l'informe: l'enunciat i, de cada errada, el tipus, la línia equivocada i la bona. */
    function itemInforme(i) {
        const ex = exemple(i),
            p = resultats[i],
            ks = Object.keys(ex.errades || {})
                .map(Number)
                .sort((a, b) => a - b);
        const errs = ks.length
            ? ks
                  .map(k => {
                      const e = ex.errades[k],
                          nom = nomTipus(e.tipus);
                      return `<div class="inf-e"><div class="inf-l">Línia ${k}${nom ? ` · ${esc(nom)}` : ''}</div><div class="inf-ll"><span class="inf-mal">${fm(lin(ex.linies[k]))}</span><span class="inf-fl" aria-hidden="true">→</span><span class="inf-bona">${fm(e.bona)}</span></div></div>`;
                  })
                  .join('')
            : '<div class="inf-l">No hi havia cap errada.</div>';
        return `<li class="inf-i ${p === PUNTS_MAX ? 'ok' : 'ko'}"><div class="inf-cap"><b>Exercici ${i + 1}</b><span>${textPunts(p).replace('+', '')}</span></div><div class="inf-enunciat">${fm(lin(ex.linies[0]))}</div>${errs}</li>`;
    }

    /** L'informe (el botó «📋 Informe»): els encerts i les errades, com a operacions. */
    function informe() {
        const ok = [],
            ko = [];
        resultats.forEach((p, i) => (p === PUNTS_MAX ? ok : ko).push(itemInforme(i)));
        final.innerHTML = `<div class="informe"><h2>Resum de les teves respostes</h2>
<h3 class="inf-t ok">Encerts (${ok.length})</h3><ul class="inf-llista">${ok.join('') || '<li class="inf-buit">Cap encert en aquesta partida.</li>'}</ul>
<h3 class="inf-t ko">Errades (${ko.length})</h3><ul class="inf-llista">${ko.join('') || '<li class="inf-buit">Cap errada! Partida perfecta 🎉</li>'}</ul>
${botons(false)}</div>`;
        lligaBotons();
        final.scrollIntoView({ block: 'start' });
    }

    function acaba() {
        if (actual) actual.destrueix();
        actual = null;
        amagaSeguent();
        llibreta.hidden = true;
        const fets = resultats.reduce((s, r) => s + r, 0);
        const v = nota(fets, total);
        posaProgres(true);
        desa(clau, { llavor: llavor(), fi: true, resultats });
        final.hidden = false;
        final.innerHTML = `<div class="resum-final"><h2>Resum</h2>
<div class="final-layout"><div class="final-summary"><ol class="resum">${resultats
            .map((p, i) => `<li><span>Exercici ${i + 1}</span><span>${textPunts(p).replace('+', '')}</span></li>`)
            .join('')}</ol>
<div class="nota"><div class="nota-t">La nota és:</div><div class="nota-v">${notaTxt(v)} / 10</div></div></div>
<div class="trofeu" aria-hidden="true">🏆</div></div>
${botons()}</div>`;
        lligaBotons();
        final.querySelector('#informe').focus({ preventScroll: true });
    }

    if (desat && (desat.fi || resultats.length >= total)) acaba();
    else if (desat) obre(Math.min(desat.i ?? resultats.length, total - 1), desat.i === resultats.length - 1 || desat.i === resultats.length ? desat.S || null : null);
    else obre(0);
    return { resultats };
}
