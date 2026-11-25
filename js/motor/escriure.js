/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/motor/escriure.js
 * ROL: «Corregeix-la» escrivint (E3; el David, 25/11/2026: l'alumne escriu
 *      només el terme encerclat, ben fet, i ho activa el professor amb
 *      escriu=1). Pur, sense DOM.
 * ARQUITECTURA:
 * - escrivible(e, linia): només si la línia equivocada i la bona tenen els
 *   mateixos termes menys l'encerclat (si l'errada canvia l'estructura de la
 *   línia, com «Termes no semblants», l'alumne tria entre les opcions).
 * - llegeix(text): «+8», «8», «−7x», «x», «-x», «10/2», «−5/2», «9/−3» → { x, n, d }
 *   (x: si és un terme amb x; n/d: el valor), o null si no s'entén.
 * - correcte(text, fitxa): s'accepta qualsevol escriptura amb el mateix valor
 *   (10/2 i 5 són el mateix nombre).
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

export function escrivible(e, linia) {
    const b = e && e.fitxesBona;
    if (!Array.isArray(b) || b.length !== linia.length) return false;
    return linia.every((t, j) => (j === e.terme ? t !== b[j] : t === b[j]));
}

/** Text escrit per l'alumne → { x, n, d } o null. */
export function llegeix(text) {
    const s = String(text).replace(/[−–]/g, '-').replace(/\s+/g, '');
    const m = /^([+-]?)(\d+)?(?:\/([+-]?\d+))?(x)?$/.exec(s);
    if (!m || (!m[2] && !m[4]) || (m[3] && !m[2]) || (m[3] && m[4])) return null;
    const signe = m[1] === '-' ? -1 : 1;
    const n = m[2] ? Number(m[2]) : 1,
        d = m[3] ? Number(m[3]) : 1;
    if (d === 0) return null;
    // el signe del denominador (9/−3) passa al numerador
    return { x: !!m[4], n: Math.sign(d) * signe * n, d: Math.abs(d) };
}

/** Una fitxa de la pantalla («+ 8», «− 7x», «{−2|2}», «x») → { x, n, d }. */
export function valorFitxa(fitxa) {
    const f = String(fitxa).replace(/\{([^|]+)\|([^}]+)\}/, '$1/$2');
    // «−{5|2}» (fracció negativa): el signe va a fora
    const m = /^([+−-]?)\s*(.*)$/.exec(f);
    const signe = m[1] === '−' || m[1] === '-' ? -1 : 1;
    const v = llegeix(m[2]);
    return v && { ...v, n: signe * v.n };
}

export function correcte(text, fitxa) {
    const a = llegeix(text),
        b = valorFitxa(fitxa);
    return !!a && !!b && a.x === b.x && a.n * b.d === b.n * a.d;
}
