/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/motor/llac.js
 * ROL: Encerclar amb el dit (R3, docs/SPEC.md): de quina línia (i de quins
 *      termes) parla un traç. Pur, sense DOM: la llibreta li passa els punts
 *      del traç i les caixes de les línies i dels termes, en les mateixes
 *      coordenades.
 * ARQUITECTURA:
 * - avalua(pts, linies) → { linia, termes } o { torna: 'per què' }.
 *   pts: [[x, y], …]; linies: [{ i, t, b, termes: [{ j, cx, cy }] }].
 * - Traç tancat: compten els termes amb el centre a dins del polígon. Si són
 *   d'una sola línia, és aquella; si n'hi ha un o dos (i no tots els de la
 *   línia), es recorden (així es pot saber si ha encerclat just el terme
 *   equivocat). Termes de més d'una línia → «Torna a marcar-ho».
 * - Traç obert (un subratllat) o tancat sense cap terme a dins: la línia que
 *   el traç cobreix verticalment, si n'hi ha una de clara.
 * - Massa petit, més d'una línia o cap línia clara → { torna }.
 * DEPENDÈNCIES: Cap.
 * ============================================================================
 */

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Punt dins d'un polígon (raig horitzontal). */
export function dins(pt, poly) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i],
            [xj, yj] = poly[j];
        if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi || 1e-9) + xi) c = !c;
    }
    return c;
}

/** Llargada del traç. */
export const llargada = pts => pts.reduce((s, p, k) => (k ? s + dist(p, pts[k - 1]) : 0), 0);

export function avalua(pts, linies) {
    if (!pts || pts.length < 4) return { torna: 'el traç és massa petit.' };
    const xs = pts.map(p => p[0]),
        ys = pts.map(p => p[1]);
    const x0 = Math.min(...xs),
        x1 = Math.max(...xs),
        y0 = Math.min(...ys),
        y1 = Math.max(...ys),
        w = x1 - x0,
        h = y1 - y0;
    if (llargada(pts) < 30 || (w < 16 && h < 16)) return { torna: 'el traç és massa petit.' };
    const tancat = dist(pts[0], pts[pts.length - 1]) < Math.max(30, 0.35 * Math.max(w, h));
    if (tancat) {
        const hits = [];
        for (const l of linies) for (const t of l.termes) if (dins([t.cx, t.cy], pts)) hits.push([l.i, t.j]);
        const ls = [...new Set(hits.map(x => x[0]))];
        if (ls.length > 1) return { torna: "el traç envolta termes de més d'una línia." };
        if (ls.length === 1) {
            const l = linies.find(x => x.i === ls[0]);
            let termes = hits.map(x => x[1]);
            if (termes.length > 2 || termes.length >= l.termes.length) termes = [];
            return { linia: ls[0], termes };
        }
    }
    // Obert, o tancat sense cap terme a dins: la línia que cobreix verticalment
    const cand = linies
        .map(l => {
            const o = Math.max(0, Math.min(y1, l.b) - Math.max(y0, l.t));
            const cy = (y0 + y1) / 2;
            return { i: l.i, f: o / Math.max(h, 1), c: cy >= l.t && cy <= l.b };
        })
        .filter(o => o.f > 0.3);
    if (cand.length === 1) return { linia: cand[0].i, termes: [] };
    if (cand.length > 1) {
        const centrades = cand.filter(o => o.c);
        if (centrades.length === 1 && cand.filter(o => o.f > 0.6).length <= 1 && h < 60) return { linia: centrades[0].i, termes: [] };
        return { torna: "el traç toca més d'una línia." };
    }
    return { torna: 'no sé quina línia has marcat.' };
}
