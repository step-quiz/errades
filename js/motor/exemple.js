/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/motor/exemple.js
 * ROL: La bastida comuna dels exemples de les dues activitats (auditoria 2, C3):
 *      el que els generadors fan igual, sigui quina sigui la matemàtica.
 * ARQUITECTURA:
 * - DISTRACTORS_PERQUE: quantes frases falses acompanyen la bona (el David,
 *   28/11/2026: la bona i 2 distractors).
 * - opcionsPerque(r, bona, dolentes) → [[text, true|false], …]: la bona i
 *   DISTRACTORS_PERQUE distractors triats a l'atzar, en un ordre a l'atzar.
 *   Els generadors i eines/frases-editor/banc.mjs la fan servir.
 * - opcionsCorregeix(r, { bona, mala, text, admet, alternatives, retoca }): les 3 opcions de
 *   «Corregeix-la»: la línia bona i dues de dolentes, primer les d'altres regles (alternatives,
 *   en ordre) i, si no n'hi ha prou, retocades (fins a 40 intents). Crida l'atzar sempre en el
 *   mateix ordre que el codi que substitueix: les mateixes llavors donen els mateixos exemples.
 * - termesEquivocats(malF, bonaF, marca): el terme (i els termes) que s'han d'encerclar.
 * - triaPerTipus(r, cs) i tipusSessio(base, i, tipus): P2, vegeu les funcions.
 * - NOMS, frasaCorrecta(escrits), notaCompensades(…),
 *   problemesErrada(j, e) (les comprovacions de valida() que són iguals a tot arreu),
 *   perPagina(ex) (l'exemple sense les dades internes).
 * DEPENDÈNCIES: js/motor/atzar.js, js/motor/util.js.
 * ============================================================================
 */
import { barreja, tria, creaAtzar } from './atzar.js';
import { llista } from './util.js';

export const DISTRACTORS_PERQUE = 2;

export const opcionsPerque = (r, bona, dolentes) => barreja(r, [[bona, true], ...barreja(r, dolentes).slice(0, DISTRACTORS_PERQUE).map(t => [t, false])]);

/** Per a les proves (tests/estadistica.test.js, P5): d'on surten les opcions falses de «Corregeix-la» que es mostren. */
export const DIAGNOSI_CORREGEIX = { actiu: false, retoca: 0, concepcio: 0 };

/** «Corregeix-la»: la línia bona i dues de dolentes, totes diferents i que no valguin el mateix que la línia d'abans. */
export function opcionsCorregeix(r, { bona, mala, text, admet, alternatives, retoca }) {
    const vistes = new Set([text(bona), text(mala)]);
    const dolentes = [];
    const retocades = new Set();
    const afegeix = (l, ret) => {
        if (l && admet(l) && !vistes.has(text(l))) {
            vistes.add(text(l));
            dolentes.push(text(l));
            if (ret) retocades.add(text(l));
        }
    };
    for (const fes of alternatives) afegeix(fes());
    for (let i = 0; dolentes.length < 2 && i < 40; i++) afegeix(retoca(), true);
    const triades = barreja(r, dolentes).slice(0, 2);
    if (DIAGNOSI_CORREGEIX.actiu) for (const t of triades) DIAGNOSI_CORREGEIX[retocades.has(t) ? 'retoca' : 'concepcio']++;
    return barreja(r, [[text(bona), true], ...triades.map(t => [t, false])]);
}

/** El primer terme diferent de la línia bona (o el que diu la regla, marca) i, si n'hi ha més d'un, tots. */
export function termesEquivocats(malF, bonaF, marca = null) {
    let terme = malF.findIndex((t, i) => t !== '=' && t !== bonaF[i]);
    if (terme < 0) terme = malF.findIndex(t => t !== '=');
    if (marca) terme = marca[0];
    const termes = marca ? marca : bonaF.length === malF.length ? malF.map((t, i) => (t !== '=' && t !== bonaF[i] ? i : -1)).filter(i => i >= 0) : [terme];
    return { terme, termes };
}

export const NOMS = ['la Marta', 'en Pau', 'la Laia', "l'Arnau", 'la Júlia', 'en Marc', 'la Noa', "l'Èric", 'la Carla', 'en Biel', "l'Aina", 'en Pol', 'la Fàtima', 'en Youssef', 'la Lucía', 'en Wei', "l'Ilyas", "l'Andrea", 'la Nerea', 'en Bilal'];

/**
 * Una injecció a l'atzar: primer el tipus d'errada (tots els que es poden aplicar valen igual: auditoria 2, P2,
 * el David 28/11/2026; o el primer de prefereix que es pugui aplicar), després la línia i, al final, una de les possibles.
 */
export function triaPerTipus(r, cs, prefereix = []) {
    const ids = [...new Set(cs.map(c => c.id))];
    // si n'hi ha cap dels preferits (les cartes que vénen de la baralla de la sessió), el primer
    const id = prefereix.find(t => ids.includes(t)) || tria(r, ids);
    // i de les línies on es pot posar, una a l'atzar: que l'errada no caigui gairebé sempre a la mateixa (P1)
    const delTipus = cs.filter(c => c.id === id);
    const j = tria(r, [...new Set(delTipus.map(c => c.j))]);
    return tria(r, delTipus.filter(c => c.j === j));
}

/**
 * El tipus d'errada que es vol a l'exercici i d'una sessió (P2): els tipus surten com les cartes d'una baralla
 * barrejada amb la llavor de la sessió, i no se'n repeteix cap fins que no han sortit tots.
 */
export function tipusSessio(base, i, tipus) {
    if (!tipus || !tipus.length) return null;
    const volta = Math.floor(i / tipus.length);
    return barreja(creaAtzar(((base ^ 0x1f3a5c7e) + volta * 15485863) >>> 0), tipus)[i % tipus.length];
}

/** «Aquesta línia és correcta, perquè és correcte haver escrit $a$ i també és correcte haver escrit $b$.» */
export function frasaCorrecta(escrits) {
    const parts = escrits.map((e, k) => (k === 0 ? `és correcte haver escrit ${e}` : `també és correcte haver escrit ${e}`));
    return `Aquesta línia és correcta, perquè ${llista(parts, 'tot és correcte')}.`;
}

/**
 * La nota de les errades compensades. resultat i proces: { art, adj }, p. ex. { art: 'la solució', adj: 'correcta' }
 * i { art: 'la resolució', adj: 'incorrecta' }.
 */
export const notaCompensades = (valor, resultat, proces) =>
    `${resultat.art[0].toUpperCase() + resultat.art.slice(1)} $${valor}$ és ${resultat.adj}, però durant ${proces.art} s'han comès dues errades que es compensen. Per tant, ${proces.art} és ${proces.adj}, encara que doni ${resultat.art} ${resultat.adj} per casualitat.`;

/** Les comprovacions de valida() que valen per a les dues activitats: les opcions de «Per què?» i de «Corregeix-la». */
export function problemesErrada(j, e) {
    const p = [];
    if (e.perque.length !== DISTRACTORS_PERQUE + 1 || e.perque.filter(o => o[1]).length !== 1) p.push(`errada ${j}: «Per què?» ha de tenir ${DISTRACTORS_PERQUE + 1} opcions i una de bona`);
    if (new Set(e.perque.map(o => o[0])).size !== DISTRACTORS_PERQUE + 1) p.push(`errada ${j}: opcions de «Per què?» repetides`);
    if (e.opcions.length !== 3 || e.opcions.filter(o => o[1]).length !== 1) p.push(`errada ${j}: «Corregeix-la» ha de tenir 3 opcions i una de bona`);
    if (new Set(e.opcions.map(o => o[0])).size !== 3) p.push(`errada ${j}: opcions de «Corregeix-la» repetides`);
    if (e.opcions.find(o => o[1])?.[0] !== e.bona) p.push(`errada ${j}: l'opció bona no és la línia bona`);
    return p;
}

/** L'exemple sense les dades internes (_linies), tal com el fa servir la pàgina. */
export const perPagina = ex => {
    const { _linies, ...resta } = ex;
    return resta;
};
