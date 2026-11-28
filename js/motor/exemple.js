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
 * - NOMS, triaPonderada(r, llista, pes), frasaCorrecta(escrits), notaCompensades(…),
 *   problemesErrada(j, e) (les comprovacions de valida() que són iguals a tot arreu),
 *   perPagina(ex) (l'exemple sense les dades internes).
 * DEPENDÈNCIES: js/motor/atzar.js, js/motor/util.js.
 * ============================================================================
 */
import { barreja } from './atzar.js';
import { llista } from './util.js';

export const DISTRACTORS_PERQUE = 2;

export const opcionsPerque = (r, bona, dolentes) => barreja(r, [[bona, true], ...barreja(r, dolentes).slice(0, DISTRACTORS_PERQUE).map(t => [t, false])]);

/** «Corregeix-la»: la línia bona i dues de dolentes, totes diferents i que no valguin el mateix que la línia d'abans. */
export function opcionsCorregeix(r, { bona, mala, text, admet, alternatives, retoca }) {
    const vistes = new Set([text(bona), text(mala)]);
    const dolentes = [];
    const afegeix = l => {
        if (l && admet(l) && !vistes.has(text(l))) {
            vistes.add(text(l));
            dolentes.push(text(l));
        }
    };
    for (const fes of alternatives) afegeix(fes());
    for (let i = 0; dolentes.length < 2 && i < 40; i++) afegeix(retoca());
    return barreja(r, [[text(bona), true], ...barreja(r, dolentes).slice(0, 2).map(t => [t, false])]);
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

/** Una regla a l'atzar, amb el pes de cadascuna. */
export function triaPonderada(r, llista, pes) {
    const total = llista.reduce((s, c) => s + pes(c), 0);
    let x = r() * total;
    for (const c of llista) {
        x -= pes(c);
        if (x < 0) return c;
    }
    return llista[llista.length - 1];
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
