/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/equacions/generador.js
 * ROL: Generador pur (sense DOM) i sembrat d'exemples erronis d'equacions de
 *      1r grau: l'enunciat, la resolució d'un alumne fictici amb una o més
 *      errades injectades, i tots els textos (explicacions, «Per què?»,
 *      «Corregeix-la», per què cada línia bona és bona).
 * ARQUITECTURA:
 * - Racionals exactes (Q). Una línia és { L: [termes], R: [termes] }. Termes:
 *   x (c·x), n (nombre), p (c·(x + b)) i f (fracció escrita tal qual, b/a).
 * - El procediment de l'alumne (OPS): exp (treu parèntesis), red1 (suma
 *   termes semblants de cada membre), tra (x a l'esquerra, nombres a la dreta),
 *   red2 (redueix: ax = b), div (x = b/a, escrit com a fracció), simp
 *   (simplifica). Cada operació només s'aplica si canvia alguna cosa.
 * - Una errada (N1, docs/SPEC.md §1.1) és una línia que no es pot deduir de
 *   l'anterior tal com està escrita: aquí, una línia amb una altra solució que
 *   l'anterior. Les regles errònies (REGLES) en fan una a partir de la línia
 *   anterior; les línies següents es tornen a calcular BÉ a partir de la
 *   dolenta.
 * - valida(exemple) comprova totes les condicions de docs/SPEC.md §5.3; el
 *   generador només torna exemples que la passen.
 * - Atzar sembrat (mulberry32): la mateixa llavor dona sempre el mateix exemple.
 * DEPENDÈNCIES: Cap. Els textos genèrics de cada tipus d'errada (data/errors.json)
 *   arriben com a paràmetre (TIPUS).
 * ============================================================================
 */

// ---------- Atzar sembrat ----------
export function creaAtzar(llavor) {
    let a = llavor >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const enter = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const tria = (r, llista) => llista[Math.floor(r() * llista.length)];
const signe = r => (r() < 0.5 ? -1 : 1);
function barreja(r, llista) {
    const a = llista.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ---------- Racionals ----------
function mcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) [a, b] = [b, a % b];
    return a || 1;
}
export class Q {
    constructor(n, d = 1) {
        if (d === 0) throw new Error('Q: denominador 0');
        if (d < 0) {
            n = -n;
            d = -d;
        }
        const g = mcd(n, d);
        this.n = n / g;
        this.d = d / g;
    }
    suma(o) { return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
    resta(o) { return new Q(this.n * o.d - o.n * this.d, this.d * o.d); }
    per(o) { return new Q(this.n * o.n, this.d * o.d); }
    entre(o) { return new Q(this.n * o.d, this.d * o.n); }
    neg() { return new Q(-this.n, this.d); }
    abs() { return new Q(Math.abs(this.n), this.d); }
    igual(o) { return this.n === o.n && this.d === o.d; }
    get zero() { return this.n === 0; }
    get enter() { return this.d === 1; }
}
const q = (n, d = 1) => new Q(n, d);
const Q0 = q(0);

// ---------- Termes i línies ----------
const X = c => ({ k: 'x', c: c instanceof Q ? c : q(c) });
const N = v => ({ k: 'n', v: v instanceof Q ? v : q(v) });
const P = (c, b) => ({ k: 'p', c, b });
const F = (num, den) => ({ k: 'f', num, den });
const linia = (L, R) => ({ L, R });

const menys = n => (n < 0 ? '−' + Math.abs(n) : String(n));
function nombre(qv) {
    // valor absolut, en el format de la pantalla: 5 o {5|9}
    const a = qv.abs();
    return a.enter ? String(a.n) : `{${a.n}|${a.d}}`;
}
function cos(t) {
    // [negatiu?, text sense signe]
    switch (t.k) {
        case 'x': {
            const a = t.c.abs();
            return [t.c.n < 0, a.enter && a.n === 1 ? 'x' : nombre(a) + 'x'];
        }
        case 'n':
            return [t.v.n < 0, nombre(t.v)];
        case 'p': {
            const ac = Math.abs(t.c);
            const dins = `x ${t.b < 0 ? '−' : '+'} ${Math.abs(t.b)}`;
            return [t.c < 0, (ac === 1 ? '' : ac + '·') + `(${dins})`];
        }
        case 'f':
            return [false, `{${menys(t.num)}|${menys(t.den)}}`];
    }
    throw new Error('terme desconegut');
}
function termeTxt(t, primer) {
    const [neg, c] = cos(t);
    if (primer) return (neg ? '−' : '') + c;
    return (neg ? '− ' : '+ ') + c;
}
/** El terme amb el seu signe a davant, sempre: «+4», «−7x» (per als textos). */
function ambSigne(t) {
    const [neg, c] = cos(t);
    return (neg ? '−' : '+') + c;
}
const costatTx = ts => ts.map((t, i) => termeTxt(t, i === 0));
export const fitxes = l => [...costatTx(l.L), '=', ...costatTx(l.R)];
export const text = l => fitxes(l).join(' ');
const sumaTx = ts => costatTx(ts).join(' ');

// ---------- Valor d'una línia ----------
function lineal(ts) {
    let a = Q0,
        b = Q0;
    for (const t of ts) {
        if (t.k === 'x') a = a.suma(t.c);
        else if (t.k === 'n') b = b.suma(t.v);
        else if (t.k === 'p') {
            a = a.suma(q(t.c));
            b = b.suma(q(t.c * t.b));
        } else if (t.k === 'f') b = b.suma(q(t.num, t.den));
    }
    return { a, b };
}
/** La solució de la línia (un Q), o null si no en té exactament una. */
export function solucio(l) {
    const e = lineal(l.L),
        d = lineal(l.R);
    const A = e.a.resta(d.a),
        B = d.b.resta(e.b);
    return A.zero ? null : B.entre(A);
}
export function equivalents(l1, l2) {
    const s1 = solucio(l1),
        s2 = solucio(l2);
    return !!s1 && !!s2 && s1.igual(s2);
}

// ---------- El procediment de l'alumne ----------
export const OPS = ['exp', 'red1', 'tra', 'red2', 'div', 'simp'];
const esX = t => t.k === 'x';
const esN = t => t.k === 'n';
const negT = t => (t.k === 'x' ? X(t.c.neg()) : N(t.v.neg()));
const buit = ts => (ts.length ? ts : [N(0)]);

function expandeix(ts, quin = null, mal = null) {
    const out = [];
    ts.forEach((t, i) => {
        if (t.k !== 'p') return out.push(t);
        out.push(X(t.c));
        const v = i === quin && mal ? mal(t) : t.c * t.b;
        if (v !== 0) out.push(N(v));
    });
    return out;
}
function agrupa(ts) {
    // suma els termes semblants, cadascun al lloc del primer
    let sx = null,
        sn = null;
    for (const t of ts) {
        if (esX(t)) sx = (sx || Q0).suma(t.c);
        if (esN(t)) sn = (sn || Q0).suma(t.v);
    }
    const out = [];
    let posX = false,
        posN = false;
    for (const t of ts) {
        if (esX(t) && !posX) {
            posX = true;
            if (!sx.zero) out.push(X(sx));
        } else if (esN(t) && !posN) {
            posN = true;
            if (!sn.zero) out.push(N(sn));
        }
    }
    return buit(out);
}
const repetits = ts => ts.filter(esX).length > 1 || ts.filter(esN).length > 1;

export function aplica(op, l) {
    switch (op) {
        case 'exp':
            if (![...l.L, ...l.R].some(t => t.k === 'p')) return null;
            return linia(expandeix(l.L), buit(expandeix(l.R)));
        case 'red1':
            if (!repetits(l.L) && !repetits(l.R)) return null;
            return linia(agrupa(l.L), agrupa(l.R));
        case 'tra': {
            const movN = l.L.filter(t => esN(t) && !t.v.zero),
                movX = l.R.filter(esX);
            if (!movN.length && !movX.length) return null;
            const L = [...l.L.filter(esX), ...movX.map(negT)];
            const R = [...l.R.filter(t => esN(t) && !(t.v.zero && (l.R.length > 1 || movN.length))), ...movN.map(negT)];
            if (!L.length) return null;
            return linia(L, buit(R));
        }
        case 'red2': {
            if (!l.L.every(esX) || !l.R.every(esN)) return null;
            if (l.L.length <= 1 && l.R.length <= 1) return null;
            const A = l.L.reduce((s, t) => s.suma(t.c), Q0),
                B = l.R.reduce((s, t) => s.suma(t.v), Q0);
            if (A.zero) return null;
            return linia([X(A)], [N(B)]);
        }
        case 'div': {
            if (l.L.length !== 1 || !esX(l.L[0]) || l.R.length !== 1 || !esN(l.R[0])) return null;
            const A = l.L[0].c,
                B = l.R[0].v;
            if (!A.enter || !B.enter || (A.n === 1 && A.d === 1)) return null;
            if (A.n === -1) return linia([X(1)], [N(B.neg())]);
            return linia([X(1)], [F(B.n, A.n)]);
        }
        case 'simp': {
            if (l.R.length !== 1 || l.R[0].k !== 'f') return null;
            const { num, den } = l.R[0];
            if (den > 1 && mcd(num, den) === 1) return null;
            return linia([X(1)], [N(q(num, den))]);
        }
    }
    throw new Error('operació desconeguda: ' + op);
}
/** Els passos que segueixen a partir de la línia l, començant per l'operació OPS[des]. */
export function resol(l, des = 0) {
    const passos = [];
    let cur = l;
    for (let k = des; k < OPS.length; k++) {
        const nou = aplica(OPS[k], cur);
        if (nou) {
            passos.push({ op: OPS[k], linia: nou });
            cur = nou;
        }
    }
    return passos;
}

// ---------- Regles errònies ----------
// Cada regla substitueix el pas `op` (a partir de la línia anterior) per una línia equivocada.
// Torna { linia, dades } o null si no es pot aplicar.
const pTx = t => termeTxt(t, true);
export const REGLES = {
    DISTRIBUTIVA: {
        op: 'exp',
        pes: 3,
        fes(l, r) {
            const tots = [...l.L.map((t, i) => ['L', i, t]), ...l.R.map((t, i) => ['R', i, t])].filter(
                ([, , t]) => t.k === 'p' && Math.abs(t.c) !== 1 && t.b !== 0
            );
            if (!tots.length) return null;
            const [c, i, t] = tria(r, tots);
            const mal = u => u.b; // el nombre de dins no es multiplica
            const L = c === 'L' ? expandeix(l.L, i, mal) : expandeix(l.L);
            const R = c === 'R' ? expandeix(l.R, i, mal) : expandeix(l.R);
            return { linia: linia(L, buit(R)), dades: { t } };
        },
        expl(d) {
            const t = d.t;
            const bo = sumaTx([X(t.c), N(t.c * t.b)]);
            return `El ${menys(t.c)} multiplica tots els termes del parèntesi: $${pTx(t)} = ${bo}$. Només ha multiplicat la $x$.`;
        },
    },
    DIST_SIGNE: {
        op: 'exp',
        pes: 3,
        fes(l, r) {
            const tots = [...l.L.map((t, i) => ['L', i, t]), ...l.R.map((t, i) => ['R', i, t])].filter(
                ([, , t]) => t.k === 'p' && t.c < 0 && t.b !== 0
            );
            if (!tots.length) return null;
            const [c, i, t] = tria(r, tots);
            const mal = u => -u.c * u.b; // el signe del segon terme no canvia
            const L = c === 'L' ? expandeix(l.L, i, mal) : expandeix(l.L);
            const R = c === 'R' ? expandeix(l.R, i, mal) : expandeix(l.R);
            return { linia: linia(L, buit(R)), dades: { t } };
        },
        expl(d) {
            const t = d.t;
            const bo = sumaTx([X(t.c), N(t.c * t.b)]);
            if (t.c === -1)
                return `El signe $−$ de davant del parèntesi canvia el signe de tots els termes de dins: $${pTx(t)} = ${bo}$.`;
            return `El $${menys(t.c)}$ multiplica tots els termes del parèntesi, amb el seu signe: $${pTx(t)} = ${bo}$.`;
        },
    },
    SIGNE_TRANSPOSAR: {
        op: 'tra',
        pes: 3,
        fes(l, r) {
            const movN = l.L.filter(t => esN(t) && !t.v.zero),
                movX = l.R.filter(esX);
            const tots = [...movN, ...movX];
            if (!tots.length) return null;
            const qui = tria(r, tots);
            const canvia = t => (t === qui ? t : negT(t));
            const L = [...l.L.filter(esX), ...movX.map(canvia)];
            const R = [...l.R.filter(t => esN(t) && !(t.v.zero && (l.R.length > 1 || movN.length))), ...movN.map(canvia)];
            if (!L.length) return null;
            return { linia: linia(L, buit(R)), dades: { t: qui } };
        },
        expl(d, bona) {
            return `El $${ambSigne(d.t)}$ passa a l'altre membre canviant de signe: havia de ser $${text(bona)}$.`;
        },
    },
    TERMES_NO_SEMBLANTS: {
        op: 'tra',
        pes: 2,
        fes(l) {
            const xs = l.L.filter(esX),
                ns = l.L.filter(t => esN(t) && !t.v.zero);
            if (xs.length !== 1 || ns.length !== 1 || l.L.length !== 2) return null;
            const c = xs[0].c,
                b = ns[0].v;
            if (!c.enter || !b.enter || c.suma(b).zero) return null;
            return { linia: linia([X(c.suma(b))], l.R), dades: { x: xs[0], n: ns[0] } };
        },
        expl(d, bona) {
            return `$${pTx(d.x)}$ i $${pTx(d.n)}$ no són termes semblants: no es poden sumar. Havia de passar el $${ambSigne(d.n)}$ a l'altre membre: $${text(bona)}$.`;
        },
    },
    CALCUL: {
        op: ['red1', 'red2'],
        pes: 1,
        fes(l, r, op) {
            const bo = aplica(op, l);
            if (!bo) return null;
            // costats on s'ha sumat de veritat (abans hi havia més d'un terme del mateix tipus)
            const opcions = [];
            for (const c of ['L', 'R'])
                for (const k of ['x', 'n']) {
                    const abans = l[c].filter(t => t.k === k);
                    if (abans.length > 1) opcions.push([c, k, abans]);
                }
            if (!opcions.length) return null;
            const [c, k, abans] = tria(r, opcions);
            const delta = tria(r, [-2, -1, 1, 2]);
            const nou = bo[c].map(t => {
                if (t.k !== k) return t;
                const v = (k === 'x' ? t.c : t.v).suma(q(delta));
                return k === 'x' ? X(v) : N(v);
            });
            const fet = nou.find(t => t.k === k);
            if (!fet || (k === 'x' ? fet.c : fet.v).zero) return null;
            const resultat = bo[c].find(t => t.k === k);
            return {
                linia: c === 'L' ? linia(nou, bo.R) : linia(bo.L, nou),
                dades: { expr: sumaTx(abans), bo: pTx(resultat), mal: pTx(fet) },
            };
        },
        expl(d) {
            return `$${d.expr} = ${d.bo}$, no $${d.mal}$.`;
        },
    },
    OPERACIO_INVERSA: {
        op: 'div',
        pes: 1,
        fes(l) {
            if (!aplica('div', l)) return null;
            const A = l.L[0].c.n,
                B = l.R[0].v.n;
            if (Math.abs(A) < 2) return null;
            return { linia: linia([X(1)], [N(B - A)]), dades: { A } };
        },
        expl(d) {
            return `El $${menys(d.A)}$ multiplica la $x$: per aïllar-la s'han de dividir els dos membres entre $${menys(d.A)}$. Ha restat $${menys(d.A)}$.`;
        },
    },
    DIVISIO_SIGNE: {
        op: 'div',
        pes: 2,
        fes(l) {
            if (!aplica('div', l)) return null;
            const A = l.L[0].c.n,
                B = l.R[0].v.n;
            if (A >= 0 || B === 0) return null;
            const L = [X(1)];
            return { linia: linia(L, [A === -1 ? N(B) : F(B, -A)]), dades: { A, B } };
        },
        expl(d) {
            return `El coeficient de la $x$ és $${menys(d.A)}$: s'ha de dividir entre $${menys(d.A)}$, amb el signe: $x = {${menys(d.B)}|${menys(d.A)}}$.`;
        },
    },
    QUOCIENT_INVERTIT: {
        op: 'div',
        pes: 2,
        fes(l) {
            if (!aplica('div', l)) return null;
            const A = l.L[0].c.n,
                B = l.R[0].v.n;
            if (Math.abs(A) < 2 || B === 0 || Math.abs(A) === Math.abs(B)) return null;
            return { linia: linia([X(1)], [F(A, B)]), dades: { A, B } };
        },
        expl(d) {
            return `Per aïllar la $x$ s'ha de dividir el terme independent entre el coeficient: $x = {${menys(d.B)}|${menys(d.A)}}$, i no $x = {${menys(d.A)}|${menys(d.B)}}$.`;
        },
    },
};
const opsDe = regla => (Array.isArray(regla.op) ? regla.op : [regla.op]);

// ---------- Per què cada línia bona és bona (F1) ----------
function perQueBona(op, abans, despres) {
    const pre = 'Aquesta línia és correcta';
    switch (op) {
        case 'exp': {
            const ps = [...abans.L, ...abans.R].filter(t => t.k === 'p');
            const parts = ps.map(t => `$${pTx(t)} = ${sumaTx([X(t.c), N(t.c * t.b)])}$`);
            return `${pre}: treu ${ps.length > 1 ? 'els parèntesis' : 'el parèntesi'} multiplicant tots els termes: ${parts.join(' i ')}.`;
        }
        case 'red1':
        case 'red2': {
            const parts = [];
            for (const c of ['L', 'R'])
                for (const k of ['x', 'n']) {
                    const ts = abans[c].filter(t => t.k === k);
                    const r = despres[c].find(t => t.k === k);
                    if (ts.length > 1) parts.push(`$${sumaTx(ts)} = ${r ? pTx(r) : '0'}$`);
                }
            return `${pre}: ${op === 'red1' ? 'suma els termes semblants de cada membre: ' : ''}${parts.join(' i ')}.`;
        }
        case 'tra': {
            const parts = [];
            for (const t of abans.R.filter(esX)) parts.push(`$${ambSigne(t)}$ passa a l'esquerra ${t.c.n < 0 ? 'sumant' : 'restant'}`);
            for (const t of abans.L.filter(t => esN(t) && !t.v.zero))
                parts.push(`$${ambSigne(t)}$ passa a la dreta ${t.v.n < 0 ? 'sumant' : 'restant'}`);
            return `${pre} respecte de l'anterior: ${parts.join(' i ')}.`;
        }
        case 'div': {
            const A = abans.L[0].c.n;
            return `${pre}: per aïllar la $x$, divideix els dos membres entre $${menys(A)}$.`;
        }
        case 'simp': {
            const f = abans.R[0];
            return `${pre}: $${cos(f)[1]} = ${termeTxt(despres.R[0], true)}$.`;
        }
    }
    return `${pre}.`;
}

// ---------- Enunciats ----------
// nivell 1: ax + b = c, ax + b = dx + e (4–5 línies)
// nivell 2: amb parèntesis (6–8 línies)
function enunciat(r, nivell) {
    const s = r() < (nivell === 1 ? 0.75 : 0.8) ? signe(r) * enter(r, 1, 9) : null; // solució entera o fraccionària
    if (nivell === 1) {
        const forma = tria(r, ['A', 'A', 'B']);
        const a = enter(r, 2, 9);
        if (forma === 'A') {
            const b = signe(r) * enter(r, 1, 15);
            const B = s !== null ? a * s : fraccionari(r, a);
            return linia([X(a), N(b)], [N(B + b)]);
        }
        const d = enter(r, 1, 9) * signe(r);
        const A = a - d;
        if (Math.abs(A) < 2) return null;
        const b = signe(r) * enter(r, 1, 15);
        const B = s !== null ? A * s : fraccionari(r, A);
        return linia([X(a), N(b)], [X(d), N(B + b)]);
    }
    const forma = tria(r, ['C', 'D', 'E', 'F']);
    const c = enter(r, 2, 6),
        b = signe(r) * enter(r, 1, 9);
    if (forma === 'C') {
        const d = enter(r, 0, 9) * signe(r);
        const A = c - d;
        if (Math.abs(A) < 2) return null;
        const B = s !== null ? A * s : fraccionari(r, A);
        const e = B + c * b;
        return linia([P(c, b)], d ? [X(d), N(e)] : [N(e)]);
    }
    if (forma === 'D') {
        const f = enter(r, 1, 5) * signe(r),
            d = enter(r, 1, 9) * signe(r);
        if (c + f === 0) return null;
        const A = c + f - d;
        if (Math.abs(A) < 2) return null;
        const B = s !== null ? A * s : fraccionari(r, A);
        return linia([P(c, b), X(f)], [X(d), N(B + c * b)]);
    }
    if (forma === 'E') {
        const e = enter(r, 1, 20),
            d = enter(r, 1, 9) * signe(r);
        const A = -c - d;
        if (Math.abs(A) < 2) return null;
        const B = s !== null ? A * s : fraccionari(r, A);
        // e − c(x + b) = dx + f  →  −c x + (e − c b) = d x + f
        return linia([N(e), P(-c, b)], [X(d), N(B + e - c * b)]);
    }
    // c(x + b) = d(x + e)  →  (c − d)x = d·e − c·b: es tria e perquè surti el B buscat
    const d = enter(r, 2, 6);
    const A = c - d;
    if (Math.abs(A) < 2) return null;
    const B = s !== null ? A * s : fraccionari(r, A);
    const e = (B + c * b) / d;
    if (!Number.isInteger(e) || e === 0) return null;
    return linia([P(c, b)], [P(d, e)]);
}
function fraccionari(r, A) {
    // un B que no sigui múltiple d'A ni 0, perquè la solució B/A sigui fraccionària i irreductible
    for (let i = 0; i < 20; i++) {
        const B = signe(r) * enter(r, 1, 20);
        if (mcd(B, A) === 1 && Math.abs(A) !== 1) return B;
    }
    return A * 2 + 1;
}

const LIMITS = { 1: [4, 5], 2: [6, 8] };
const NOMS = ['la Marta', 'en Pau', 'la Laia', "l'Arnau", 'la Júlia', 'en Marc', 'la Noa', "l'Èric", 'la Carla', 'en Biel', "l'Aina", 'en Pol'];
const dinsMarge = l => [...l.L, ...l.R].every(t => {
    if (t.k === 'x') return Math.abs(t.c.n) <= 40 && t.c.d === 1;
    if (t.k === 'n') return Math.abs(t.v.n) <= 120 && t.v.d <= 40;
    if (t.k === 'p') return Math.abs(t.c) <= 9 && Math.abs(t.b) <= 20;
    return Math.abs(t.num) <= 120 && Math.abs(t.den) <= 40;
});

// ---------- Injecció ----------
function candidates(r, linies, ops, des = 1) {
    const out = [];
    for (let j = Math.max(1, des); j < linies.length; j++) {
        const op = ops[j];
        for (const [id, regla] of Object.entries(REGLES)) {
            if (!opsDe(regla).includes(op)) continue;
            const res = regla.fes(linies[j - 1], r, op);
            if (!res) continue;
            const mal = res.linia;
            if (!solucio(mal) || equivalents(linies[j - 1], mal) || !dinsMarge(mal)) continue;
            out.push({ j, id, op, res });
        }
    }
    return out;
}
function triaPonderada(r, llista) {
    const total = llista.reduce((s, c) => s + REGLES[c.id].pes, 0);
    let x = r() * total;
    for (const c of llista) {
        x -= REGLES[c.id].pes;
        if (x < 0) return c;
    }
    return llista[llista.length - 1];
}
function injecta(linies, ops, c) {
    // les línies fins a j−1, la dolenta, i la resta calculada bé a partir de la dolenta
    const k = OPS.indexOf(c.op);
    const despres = resol(c.res.linia, k);
    return {
        linies: [...linies.slice(0, c.j), c.res.linia, ...despres.map(p => p.linia)],
        ops: [...ops.slice(0, c.j), c.op, ...despres.map(p => p.op)],
    };
}

/**
 * Un exemple nou.
 * @param {object} o
 * @param {number} o.llavor      llavor de l'atzar
 * @param {number} [o.nivell]    1 o 2 (etapa 1)
 * @param {number} [o.errades]   0, 1 o 2
 * @param {boolean} [o.compensades] amb 2 errades: la solució final és la bona (N4)
 * @param {object} TIPUS         data/errors.json (textos genèrics de «Per què?»)
 */
export function generaExemple({ llavor, nivell = 1, errades = 1, compensades = false }, TIPUS) {
    const r = creaAtzar(llavor);
    const [mn, mx] = LIMITS[nivell] || LIMITS[1];
    for (let intent = 0; intent < 400; intent++) {
        const e0 = enunciat(r, nivell);
        if (!e0 || !solucio(e0) || !dinsMarge(e0)) continue;
        const passos = resol(e0);
        let linies = [e0, ...passos.map(p => p.linia)];
        let ops = [null, ...passos.map(p => p.op)];
        if (!linies.every(dinsMarge)) continue;
        const marques = [];
        let ok = true;
        if (compensades && errades === 2) {
            const parells = [];
            for (const c1 of candidates(r, linies, ops)) {
                const p1 = injecta(linies, ops, c1);
                for (const c2 of candidates(r, p1.linies, p1.ops, c1.j + 1)) {
                    const p2 = injecta(p1.linies, p1.ops, c2);
                    if (solucio(p2.linies[p2.linies.length - 1]).igual(solucio(e0))) parells.push([c1, c2, p2]);
                }
            }
            if (!parells.length) continue;
            const [c1, c2, p2] = tria(r, parells);
            marques.push(c1, c2);
            ({ linies, ops } = p2);
        } else {
            for (let k = 0; k < errades; k++) {
                const des = marques.length ? marques[marques.length - 1].j + 1 : 1;
                let cs = candidates(r, linies, ops, des);
                if (k === errades - 1)
                    cs = cs.filter(c => {
                        const n = injecta(linies, ops, c).linies.length;
                        return n >= mn && n <= mx;
                    });
                if (!cs.length) {
                    ok = false;
                    break;
                }
                const c = triaPonderada(r, cs);
                marques.push(c);
                ({ linies, ops } = injecta(linies, ops, c));
            }
        }
        if (!ok || linies.length < mn || linies.length > mx || !linies.every(dinsMarge)) continue;
        if (!compensades && errades === 2 && solucio(linies[linies.length - 1]).igual(solucio(e0))) continue;
        const ex = construeix(r, llavor, nivell, e0, linies, ops, marques, compensades, TIPUS);
        if (valida(ex).length === 0) return ex;
    }
    throw new Error(`No s'ha pogut generar cap exemple (llavor ${llavor}, nivell ${nivell})`);
}

function construeix(r, llavor, nivell, e0, linies, ops, marques, compensades, TIPUS) {
    const ex = {
        llavor,
        nivell,
        alumne: tria(r, NOMS),
        linies: linies.map(fitxes),
        errades: {},
        correctes: {},
        nota: null,
        solucio: text(linia([X(1)], [N(solucio(e0))])),
        _linies: linies,
    };
    for (const c of marques) {
        const regla = REGLES[c.id];
        const abans = linies[c.j - 1];
        const bona = aplica(c.op, abans);
        const bonaF = fitxes(bona),
            malF = fitxes(linies[c.j]);
        let terme = malF.findIndex((t, i) => t !== '=' && t !== bonaF[i]);
        if (terme < 0) terme = malF.findIndex(t => t !== '=');
        // «Per què?»: la bona i dues d'altres operacions
        const altres = barreja(
            r,
            Object.keys(REGLES).filter(id => !opsDe(REGLES[id]).some(o => opsDe(regla).includes(o)))
        ).slice(0, 2);
        const perque = barreja(r, [[TIPUS[c.id].perque, true], ...altres.map(id => [TIPUS[id].perque, false])]);
        // «Corregeix-la»: la línia bona i dues de dolentes (d'altres regles o retocades)
        const vistes = new Set([text(bona), text(linies[c.j])]);
        const dolentes = [];
        for (const [id, rg] of Object.entries(REGLES)) {
            if (id === c.id || !opsDe(rg).includes(c.op)) continue;
            const res = rg.fes(abans, r, c.op);
            if (res && !equivalents(abans, res.linia) && !vistes.has(text(res.linia))) {
                vistes.add(text(res.linia));
                dolentes.push(text(res.linia));
            }
        }
        for (let i = 0; dolentes.length < 2 && i < 40; i++) {
            const t = retoca(r, bona);
            if (t && !vistes.has(text(t)) && !equivalents(abans, t)) {
                vistes.add(text(t));
                dolentes.push(text(t));
            }
        }
        const opcions = barreja(r, [[text(bona), true], ...barreja(r, dolentes).slice(0, 2).map(t => [t, false])]);
        ex.errades[c.j] = {
            tipus: c.id,
            terme,
            expl: regla.expl(c.res.dades, bona),
            bona: text(bona),
            perque,
            opcions,
        };
    }
    for (let i = 1; i < linies.length; i++) if (!ex.errades[i]) ex.correctes[i] = perQueBona(ops[i], linies[i - 1], linies[i]);
    if (compensades)
        ex.nota = `La solució $${ex.solucio}$ és correcta, però el procediment té dues errades que es compensen. Una solució bona no vol dir un procediment bo.`;
    return ex;
}
function retoca(r, l) {
    // una variant equivocada de la línia: un nombre canviat o un signe girat
    const c = tria(r, ['L', 'R']);
    const ts = l[c];
    if (!ts.length) return null;
    const i = enter(r, 0, ts.length - 1),
        t = ts[i];
    let nou;
    if (t.k === 'x') nou = X(r() < 0.5 ? t.c.neg() : t.c.suma(q(tria(r, [-2, -1, 1, 2]))));
    else if (t.k === 'n') nou = N(r() < 0.5 ? t.v.neg() : t.v.suma(q(tria(r, [-2, -1, 1, 2]))));
    else if (t.k === 'f') nou = F(-t.num, t.den);
    else return null;
    if ((nou.k === 'x' && nou.c.zero) || (nou.k === 'n' && nou.v.zero && ts.length > 1)) return null;
    const out = ts.slice();
    out[i] = nou;
    const res = c === 'L' ? linia(out, l.R) : linia(l.L, out);
    return solucio(res) ? res : null;
}

/**
 * Comprova un exemple (docs/SPEC.md §5.3). Torna la llista de problemes ([] si és bo).
 */
export function valida(ex) {
    const p = [];
    const ls = ex._linies;
    if (!ls || ls.length < 3) return ['massa poques línies'];
    const err = Object.keys(ex.errades).map(Number);
    if (err.includes(0)) p.push("l'enunciat no pot ser una errada");
    for (let i = 0; i < ls.length; i++) {
        if (!solucio(ls[i])) p.push(`línia ${i + 1}: no té una sola solució`);
        if (ex.linies[i].filter(t => t === '=').length !== 1) p.push(`línia ${i + 1}: no té exactament un «=»`);
    }
    for (let i = 1; i < ls.length; i++) {
        const eq = equivalents(ls[i - 1], ls[i]);
        if (err.includes(i) && eq) p.push(`línia ${i + 1}: marcada com a errada però es dedueix de l'anterior`);
        if (!err.includes(i) && !eq) p.push(`línia ${i + 1}: no es dedueix de l'anterior però no està marcada`);
        if (!err.includes(i) && !ex.correctes[i]) p.push(`línia ${i + 1}: falta el text de per què és correcta`);
    }
    const ult = ls[ls.length - 1];
    if (!(ult.L.length === 1 && esX(ult.L[0]) && ult.L[0].c.n === 1 && ult.L[0].c.d === 1 && ult.R.length === 1 && esN(ult.R[0])))
        p.push("l'última línia no és «x = valor»");
    for (const [j, e] of Object.entries(ex.errades)) {
        if (e.perque.length !== 3 || e.perque.filter(o => o[1]).length !== 1) p.push(`errada ${j}: «Per què?» ha de tenir 3 opcions i una de bona`);
        if (new Set(e.perque.map(o => o[0])).size !== 3) p.push(`errada ${j}: opcions de «Per què?» repetides`);
        if (e.opcions.length !== 3 || e.opcions.filter(o => o[1]).length !== 1) p.push(`errada ${j}: «Corregeix-la» ha de tenir 3 opcions i una de bona`);
        if (new Set(e.opcions.map(o => o[0])).size !== 3) p.push(`errada ${j}: opcions de «Corregeix-la» repetides`);
        if (e.opcions.find(o => o[1])?.[0] !== e.bona) p.push(`errada ${j}: l'opció bona no és la línia bona`);
        if (e.bona === ex.linies[j].join(' ')) p.push(`errada ${j}: la línia bona és igual que la dolenta`);
        if (!(e.terme >= 0 && e.terme < ex.linies[j].length) || ex.linies[j][e.terme] === '=') p.push(`errada ${j}: terme equivocat fora de lloc`);
    }
    const tot = JSON.stringify({ ...ex, _linies: undefined });
    if (/undefined|NaN|Infinity|\[object/.test(tot)) p.push('hi ha textos amb undefined, NaN o [object');
    return p;
}

/** L'exemple sense les dades internes (_linies), tal com el fa servir la pàgina. */
export const perPagina = ex => {
    const { _linies, ...resta } = ex;
    return resta;
};
