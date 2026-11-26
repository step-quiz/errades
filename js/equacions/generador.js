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
/** c·(mx + b); m (el coeficient de dins) és 1 si no es diu (el David, errades reals: −2·(3x + 6)). */
const P = (c, b, m = 1) => ({ k: 'p', c, b, m });
const F = (num, den) => ({ k: 'f', num, den });
/** a/x: la x al denominador (el David, 26/11/2026: 30/x = 5). */
const I = a => ({ k: 'i', a });
/** s·(mx + b)/den: una fracció amb un binomi al numerador, amb el signe s (±1) de davant (el David: (3x + 5)/2 − (x − 4)/3). */
const D = (s, m, b, den) => ({ k: 'd', s, m, b, den });
/** a·b sense calcular (x = 30·5). */
const M = (a, b) => ({ k: 'm', a, b });
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
            const dins = `${t.m === 1 ? '' : t.m}x ${t.b < 0 ? '−' : '+'} ${Math.abs(t.b)}`;
            return [t.c < 0, (ac === 1 ? '' : ac + '·') + `(${dins})`];
        }
        case 'f':
            return [false, `{${menys(t.num)}|${menys(t.den)}}`];
        case 'i':
            return [t.a < 0, `{${Math.abs(t.a)}|x}`];
        case 'd':
            return [t.s < 0, `{${t.m === 1 ? '' : t.m}x ${t.b < 0 ? '−' : '+'} ${Math.abs(t.b)}|${t.den}}`];
        case 'm':
            return [t.a < 0, `${Math.abs(t.a)}·${t.b < 0 ? '(' + menys(t.b) + ')' : t.b}`];
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
            a = a.suma(q(t.c * t.m));
            b = b.suma(q(t.c * t.b));
        } else if (t.k === 'f') b = b.suma(q(t.num, t.den));
        else if (t.k === 'd') {
            a = a.suma(q(t.s * t.m, t.den));
            b = b.suma(q(t.s * t.b, t.den));
        } else if (t.k === 'm') b = b.suma(q(t.a * t.b));
    }
    return { a, b };
}
/** La solució de la línia (un Q), o null si no en té exactament una. */
export function solucio(l) {
    // a/x + n = m: l'única x és al denominador (x = a / (el que queda))
    const is = [...l.L, ...l.R].filter(t => t.k === 'i');
    if (is.length) {
        if (is.length > 1 || ![...l.L, ...l.R].every(t => t.k === 'i' || t.k === 'n')) return null;
        const [c, o] = l.L.includes(is[0]) ? ['L', 'R'] : ['R', 'L'];
        const B = lineal(l[o]).b.resta(lineal(l[c].filter(t => t.k !== 'i')).b);
        return B.zero ? null : q(is[0].a).entre(B);
    }
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
// den: treure denominadors (D); neg: canviar el signe de tots els termes (−4x + 5 − 3x = 6 − x);
// inv: la x surt del denominador (a/x = B → Bx = a) (el David, 26/11/2026)
export const OPS = ['den', 'exp', 'neg', 'red1', 'tra', 'red2', 'inv', 'div', 'simp'];
const esX = t => t.k === 'x';
const esN = t => t.k === 'n';
const negT = t => (t.k === 'x' ? X(t.c.neg()) : N(t.v.neg()));
const buit = ts => (ts.length ? ts : [N(0)]);

function expandeix(ts, quin = null, mal = null, malX = null) {
    // mal(t): el nombre equivocat; malX(t): el coeficient de la x equivocat (al parèntesi número quin)
    const out = [];
    ts.forEach((t, i) => {
        if (t.k !== 'p') return out.push(t);
        out.push(X(i === quin && malX ? malX(t) : t.c * t.m));
        const v = i === quin && mal ? mal(t) : t.c * t.b; // (sense mal, el nombre es multiplica bé)
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

const mcm = (a, b) => (a * b) / mcd(a, b);
/** El pas «neg» només quan l'equació comença amb termes en x negatius: −4x + 5 − 3x = 6 − x. */
const negable = l =>
    l.L.length > 0 &&
    esX(l.L[0]) &&
    l.L[0].c.n < 0 &&
    l.L.filter(esX).length >= 2 &&
    l.L.filter(esX).every(t => t.c.n < 0) &&
    l.R.some(esX) &&
    [...l.L, ...l.R].every(t => esX(t) || esN(t));
export function aplica(op, l) {
    switch (op) {
        case 'den': {
            const ds = [...l.L, ...l.R].filter(t => t.k === 'd');
            if (!ds.length) return null;
            const Mx = ds.reduce((m, t) => mcm(m, t.den), 1);
            const fes = ts =>
                ts.flatMap(t => {
                    if (t.k === 'd') {
                        const k = Mx / t.den;
                        return t.b ? [X(t.s * t.m * k), N(t.s * t.b * k)] : [X(t.s * t.m * k)];
                    }
                    if (esX(t)) return [X(t.c.per(q(Mx)))];
                    return [N(t.v.per(q(Mx)))];
                });
            return linia(fes(l.L), buit(fes(l.R)));
        }
        case 'neg':
            if (!negable(l)) return null;
            return linia(l.L.map(negT), l.R.map(negT));
        case 'inv': {
            if (l.L.length !== 1 || l.L[0].k !== 'i' || l.R.length !== 1 || !esN(l.R[0]) || l.R[0].v.zero) return null;
            return linia([X(l.R[0].v)], [N(l.L[0].a)]);
        }
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
            const L = [...l.L.filter(t => esX(t) || t.k === 'i'), ...movX.map(negT)];
            const R = [...l.R.filter(t => esN(t) && !(t.v.zero && (l.R.length > 1 || movN.length))), ...movN.map(negT)];
            if (!L.length) return null;
            return linia(L, buit(R));
        }
        case 'red2': {
            if (l.L.length === 1 && l.L[0].k === 'i' && l.R.length > 1 && l.R.every(esN))
                return linia(l.L, [N(l.R.reduce((s, t) => s.suma(t.v), Q0))]);
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
            if (l.R.length === 1 && l.R[0].k === 'm') return linia([X(1)], [N(l.R[0].a * l.R[0].b)]);
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

/**
 * Els termes de la línia bona (aplica(op, l)) que en aquest pas només es copien
 * de la línia de sobre: [[costat, posició], ...]. Serveix per a SIGNE_COPIAT.
 */
function copiats(op, l, bo) {
    const out = [];
    if (op === 'exp') {
        for (const c of ['L', 'R']) {
            let k = 0;
            for (const t of l[c]) {
                if (t.k !== 'p') out.push([c, k++]);
                else k += t.c * t.b !== 0 ? 2 : 1;
            }
        }
    } else if (op === 'red1') {
        // agrupa(): cada tipus de terme surt al lloc del primer; si n'hi havia un de sol, es copia
        for (const c of ['L', 'R']) {
            let k = 0;
            const vist = {};
            for (const t of l[c]) {
                if ((t.k !== 'x' && t.k !== 'n') || vist[t.k]) continue;
                vist[t.k] = true;
                const mateixos = l[c].filter(u => u.k === t.k);
                const suma = mateixos.reduce((s, u) => s.suma(u.k === 'x' ? u.c : u.v), Q0);
                if (suma.zero) continue;
                if (mateixos.length === 1) out.push([c, k]);
                k++;
            }
        }
    } else if (op === 'tra') {
        const queden = l.R.filter(t => esN(t) && !t.v.zero).length;
        l.L.filter(esX).forEach((t, k) => out.push(['L', k]));
        for (let k = 0; k < queden; k++) out.push(['R', k]);
    }
    // només els que es poden copiar amb el signe equivocat: un signe que es veu
    return out.filter(([c, i]) => {
        const t = bo[c][i];
        if (!t || (t.k !== 'x' && t.k !== 'n') || (t.k === 'x' ? t.c : t.v).zero) return false;
        return i > 0 || (t.k === 'x' ? t.c : t.v).n < 0;
    });
}

/** «El $+3$ i el $+2x$» (amb majúscula) o «el $+3$ i el $+2x$». */
const llistaTermes = (ts, maj = false) => {
    const t = ts.map(u => `el $${ambSigne(u)}$`);
    const txt = t.length > 1 ? t.slice(0, -1).join(', ') + ' i ' + t[t.length - 1] : t[0];
    return maj ? txt[0].toUpperCase() + txt.slice(1) : txt;
};

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
            return `El $${menys(t.c)}$ multiplica tots els termes del parèntesi, també el $${menys(t.b)}$. Només ha multiplicat ${t.m === 1 ? 'la $x$' : `el $${t.m}x$`}.`;
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
            if (t.c === -1)
                return `El signe $−$ de davant del parèntesi canvia el signe de tots els termes de dins, també el del $${menys(t.b)}$.`;
            return `El $${menys(t.c)}$ multiplica tots els termes del parèntesi amb el seu signe: el $${menys(t.b)}$ també havia de canviar de signe.`;
        },
    },
    SUMA_ABANS_PRODUCTE: {
        // 3 + 2·(x − 4) → 5·(x − 4) (suma abans de multiplicar) o, fins i tot, → 5x − 4 (a més, només multiplica la x)
        // (el David, banc d'errades, 26/11/2026). Només amb un sol parèntesi a la línia, «a + c·(…)», a i c positius.
        op: 'exp',
        pes: 2,
        fes(l, r) {
            const tots = [];
            for (const c of ['L', 'R'])
                l[c].forEach((t, i) => {
                    const a = l[c][i - 1];
                    if (t.k === 'p' && t.c > 0 && t.b !== 0 && a && esN(a) && a.v.n > 0 && a.v.d === 1) tots.push([c, i]);
                });
            if (tots.length !== 1 || [...l.L, ...l.R].filter(t => t.k === 'p').length !== 1) return null;
            const [c, i] = tots[0];
            const a = l[c][i - 1].v.n,
                t = l[c][i];
            const s = a + t.c;
            const variant = r() < 0.65 ? 'parentesi' : 'x';
            const nou = variant === 'parentesi' ? [P(s, t.b, t.m)] : [X(s * t.m), N(t.b)];
            const ts = [...l[c].slice(0, i - 1), ...nou, ...l[c].slice(i + 1)];
            return { linia: c === 'L' ? linia(ts, l.R) : linia(l.L, ts), dades: { a, t, s, variant } };
        },
        expl(d) {
            return `La multiplicació va abans que la suma: el $${d.t.c}$ multiplica el parèntesi, i el $${d.a}$ no s'hi podia sumar abans.`;
        },
    },
    INVERS_X: {
        // 30/x = 5 → x = 30·5 (el David, 26/11/2026): passa la x a l'altre membre «multiplicant», i hi passa el 5
        op: 'inv',
        pes: 3,
        fes(l) {
            if (!aplica('inv', l) || !l.R[0].v.enter) return null;
            const a = l.L[0].a,
                B = l.R[0].v.n;
            return { linia: linia([X(1)], [M(a, B)]), dades: { a, B, marca: [2] } };
        },
        expl(d) {
            return `La $x$ és al denominador: si $${menys(d.a)} : x = ${menys(d.B)}$, la $x$ és el nombre que fa aquesta divisió, és a dir, $${menys(d.a)} : ${d.B < 0 ? '(' + menys(d.B) + ')' : d.B}$. No s'havia de multiplicar.`;
        },
    },
    CANVI_SIGNE_PARCIAL: {
        // −4x + 5 − 3x = 6 − x → 4x − 5 + 3x = 6 + x (el David, 26/11/2026): canvia els signes, però no de tots els termes
        op: 'neg',
        pes: 3,
        fes(l, r) {
            const bo = aplica('neg', l);
            if (!bo) return null;
            const llocs = [...l.L.map((t, i) => ['L', i]), ...l.R.map((t, i) => ['R', i])].filter(([c, i]) => i > 0 || c === 'R');
            const [c, i] = tria(r, llocs);
            const nou = bo[c].slice();
            nou[i] = l[c][i];
            return { linia: c === 'L' ? linia(nou, bo.R) : linia(bo.L, nou), dades: { t: l[c][i], costat: c } };
        },
        expl(d) {
            return `Per canviar el signe de tota l'equació s'han de canviar els signes de tots els termes, dels dos membres: el $${ambSigne(d.t)}$ també havia de canviar de signe.`;
        },
    },
    DENOMINADORS: {
        // (3x + 5)/2 − (x − 4)/3 = 5x → 9x + 15 − 2x − 8 = 30x (el David, 26/11/2026): el − de davant de la fracció no canvia
        // el signe del segon terme del numerador; o bé els termes sense denominador no es multipliquen (5x es queda 5x)
        op: 'den',
        pes: 3,
        fes(l, r) {
            const bo = aplica('den', l);
            if (!bo) return null;
            const ds = [...l.L, ...l.R].filter(t => t.k === 'd');
            const Mx = ds.reduce((m, t) => mcm(m, t.den), 1);
            const variants = [];
            const negs = ds.filter(t => t.s < 0 && t.b !== 0);
            if (negs.length) variants.push('signe');
            if ([...l.L, ...l.R].some(t => t.k !== 'd') && Mx > 1) variants.push('sense');
            if (!variants.length) return null;
            const variant = tria(r, variants);
            const dq = variant === 'signe' ? tria(r, negs) : null;
            const fes = ts =>
                ts.flatMap(t => {
                    if (t.k === 'd') {
                        const k = Mx / t.den;
                        const nb = t === dq ? t.b * k : t.s * t.b * k;
                        return t.b ? [X(t.s * t.m * k), N(nb)] : [X(t.s * t.m * k)];
                    }
                    if (variant === 'sense') return [t];
                    if (esX(t)) return [X(t.c.per(q(Mx)))];
                    return [N(t.v.per(q(Mx)))];
                });
            return { linia: linia(fes(l.L), buit(fes(l.R))), dades: { variant, t: dq, M: Mx } };
        },
        expl(d) {
            if (d.variant === 'signe') return `El signe $−$ de davant de la fracció afecta tot el numerador: en treure el denominador, el $${menys(d.t.b)}$ també havia de canviar de signe.`;
            return `Per treure els denominadors es multipliquen els dos membres per $${d.M}$: s'han de multiplicar tots els termes, també els que no tenen denominador.`;
        },
    },
    DIST_SUMA: {
        // El nombre de fora i el coeficient de dins se sumen (el David, errades reals:
        // x − 2·(3x + 6) = 3x + 7  →  x − 5x − 12 = 3x + 7). Només amb un coeficient a dins.
        op: 'exp',
        pes: 1,
        fes(l, r) {
            const tots = [...l.L.map((t, i) => ['L', i, t]), ...l.R.map((t, i) => ['R', i, t])].filter(
                ([, , t]) => t.k === 'p' && t.m >= 2 && Math.abs(t.c) >= 2 && Math.abs(t.c) !== t.m // 4·(4x…): no se sap què ha sumat
            );
            if (!tots.length) return null;
            const [c, i, t] = tria(r, tots);
            const malX = u => Math.sign(u.c) * (Math.abs(u.c) + u.m);
            const L = c === 'L' ? expandeix(l.L, i, null, malX) : expandeix(l.L);
            const R = c === 'R' ? expandeix(l.R, i, null, malX) : expandeix(l.R);
            return { linia: linia(L, buit(R)), dades: { t, mal: X(malX(t)) } };
        },
        expl(d) {
            const t = d.t;
            return `$${menys(t.c)} · ${t.m}x$ no fa $${pTx(d.mal)}$: el nombre de fora del parèntesi multiplica el $${t.m}x$, no s'hi suma.`;
        },
    },
    SIGNE_TRANSPOSAR: {
        op: 'tra',
        pes: 4,
        fes(l, r) {
            const movN = l.L.filter(t => esN(t) && !t.v.zero),
                movX = l.R.filter(esX);
            const tots = [...movN, ...movX];
            if (!tots.length) return null;
            // Erbaş et al. (2009), YK26: tots els termes que passen es queden amb el seu signe (el 35 % de les vegades que en passen dos o més)
            const doble = tots.length >= 2 && r() < 0.35;
            const qui = tria(r, tots);
            const canvia = t => (doble || t === qui ? t : negT(t));
            const L = [...l.L.filter(esX), ...movX.map(canvia)];
            const R = [...l.R.filter(t => esN(t) && !(t.v.zero && (l.R.length > 1 || movN.length))), ...movN.map(canvia)];
            if (!L.length) return null;
            if (doble) return { linia: linia(L, buit(R)), dades: { t: tots[0], tots } };
            return { linia: linia(L, buit(R)), dades: { t: qui, altres: tots.filter(t => t !== qui) } };
        },
        expl(d, bona) {
            if (d.tots) return `${llistaTermes(d.tots, true)} han passat a l'altre membre sense canviar de signe, i en passar-hi havien de canviar de signe.`;
            return `El $${ambSigne(d.t)}$ ha passat a l'altre membre sense canviar de signe, i en passar-hi havia de canviar de signe.`;
        },
    },
    SIGNE_COPIAT: {
        // Un terme que en aquest pas només s'havia de copiar surt amb el signe canviat
        // (el David, lot 1, B05 i B15): 9x + 7 = 3x − 23  →  9x − 3x = 23 − 7.
        op: ['exp', 'red1', 'tra'],
        pes: 2,
        fes(l, r, op) {
            const bo = aplica(op, l);
            if (!bo) return null;
            const llista = copiats(op, l, bo);
            if (!llista.length) return null;
            // amb dos signes copiats malament el 30 % de les vegades que es pot (el David, B15: −3x + 8 = −7x + 36)
            const quins = llista.length >= 2 && r() < 0.3 ? barreja(r, llista).slice(0, 2) : [tria(r, llista)];
            const nou = { L: bo.L.slice(), R: bo.R.slice() };
            for (const [c, i] of quins) nou[c][i] = negT(bo[c][i]);
            const ts = quins.map(([c, i]) => bo[c][i]),
                mals = quins.map(([c, i]) => nou[c][i]);
            return { linia: linia(nou.L, nou.R), dades: { t: ts[0], mal: mals[0], ts, mals, op } };
        },
        expl(d) {
            if (d.ts.length > 1) return `Ha escrit ${d.mals.map(m => `$${ambSigne(m)}$`).join(' i ')}, però aquests termes no intervenien en aquest pas: s'havien de copiar tal com eren a la línia de sobre.`;
            return `Ha escrit $${ambSigne(d.mal)}$, però aquest terme no intervenia en aquest pas: s'havia de copiar tal com era a la línia de sobre.`;
        },
    },
    TERMES_NO_SEMBLANTS: {
        op: ['tra', 'red1'],
        pes: 5,
        fes(l, r, op = 'tra') {
            if (op === 'red1') {
                // 2x + 3 + 4x = 18  →  9x = 18 (el David, lot 1, B16): ho suma tot com si fossin x
                const costats = ['L', 'R'].filter(c => {
                    const ts = l[c];
                    return ts.filter(esX).length >= 2 && ts.filter(t => esN(t) && !t.v.zero).length >= 1 && ts.every(t => esX(t) || esN(t));
                });
                if (!costats.length) return null;
                const c = tria(r, costats);
                const xs = l[c].filter(esX),
                    ns = l[c].filter(t => esN(t) && !t.v.zero);
                const tot = [...xs.map(t => t.c), ...ns.map(t => t.v)].reduce((s, v) => s.suma(v), Q0);
                // amb nombres grans (−48) l'errada ja no és versemblant
                if (tot.zero || !tot.enter || ns.some(t => Math.abs(t.v.n) > 15)) return null;
                const mal = [X(tot)];
                const altre = agrupa(l[c === 'L' ? 'R' : 'L']);
                return { linia: c === 'L' ? linia(mal, altre) : linia(altre, mal), dades: { tres: true, xs, ns } };
            }
            const xs = l.L.filter(esX),
                ns = l.L.filter(t => esN(t) && !t.v.zero);
            if (xs.length !== 1 || ns.length !== 1 || l.L.length !== 2) return null;
            const c = xs[0].c,
                b = ns[0].v;
            if (!c.enter || !b.enter || c.suma(b).zero) return null;
            return { linia: linia([X(c.suma(b))], l.R), dades: { x: xs[0], n: ns[0] } };
        },
        expl(d, bona) {
            if (d.tres) {
                const xs = `$${pTx(d.xs[0])}$ i $${ambSigne(d.xs[1])}$`;
                if (d.ns.length === 1) return `El $${ambSigne(d.ns[0])}$ no té $x$: no és un terme semblant a ${xs}, i no s'hi pot sumar.`;
                return `Els nombres no tenen $x$: no són termes semblants a ${xs}, i no s'hi poden sumar.`;
            }
            return `$${pTx(d.x)}$ i $${pTx(d.n)}$ no són termes semblants: no es poden sumar. El $${ambSigne(d.n)}$ havia de passar a l'altre membre.`;
        },
    },
    COEFICIENT_U: {
        // La x sola no es compta (el David, errades reals: 3x + x + 6x = 4 − 2x  →  9x = 4 − 2x).
        op: ['red1', 'red2'],
        pes: 2,
        fes(l, r, op) {
            const bo = aplica(op, l);
            if (!bo) return null;
            const u1 = t => esX(t) && t.c.abs().igual(q(1));
            const costats = ['L', 'R'].filter(c => l[c].filter(esX).length >= 2 && l[c].some(u1));
            if (!costats.length) return null;
            const c = tria(r, costats);
            const xs = l[c].filter(esX);
            const u = tria(r, xs.filter(u1));
            const S = xs.reduce((s, t) => s.suma(t.c), Q0);
            const w = S.resta(u.c);
            const k = bo[c].findIndex(esX);
            if (w.zero || k < 0) return null;
            const nou = bo[c].slice();
            nou[k] = X(w);
            return { linia: c === 'L' ? linia(nou, bo.R) : linia(bo.L, nou), dades: { expr: sumaTx(xs), u, mal: X(w) } };
        },
        expl(d) {
            const neg = d.u.c.n < 0;
            return `La $${neg ? '−x' : 'x'}$ vol dir $${neg ? '−1x' : '1x'}$: també s'havia de comptar en fer $${d.expr}$.`;
        },
    },
    CALCUL: {
        // Errades de signe versemblants (el David, lot 1, B07): amb −3 + 15, l'alumne
        // escriu −12 (s'equivoca en el signe) o −18 (els suma com si tinguessin el
        // mateix signe); amb −3 − 15, escriu +18 (signe) o −12 (els resta). Només
        // sumes de dos termes on n'hi ha algun de negatiu.
        op: ['red1', 'red2'],
        pes: 4,
        fes(l, r, op) {
            const bo = aplica(op, l);
            if (!bo) return null;
            const opcions = [];
            for (const c of ['L', 'R'])
                for (const k of ['x', 'n']) {
                    const abans = l[c].filter(t => t.k === k);
                    const vs = abans.map(t => (k === 'x' ? t.c : t.v));
                    if (abans.length === 2 && vs.some(v => v.n < 0) && vs.every(v => !v.zero)) opcions.push([c, k, abans, vs]);
                }
            if (!opcions.length) return null;
            const triada = tria(r, opcions);
            const [c, k, abans, [v1, v2]] = triada;
            const S = v1.suma(v2);
            const neg1 = v1.n < 0,
                neg2 = v2.n < 0;
            const absos = [v1.abs(), v2.abs()];
            const amb = (v, negatiu) => (negatiu ? v.neg() : v);
            const tipus =
                neg1 !== neg2
                    ? [['signe', S.neg()], ['suma', amb(absos[0].suma(absos[1]), neg1)]]
                    : [['signe', S.neg()], ['resta', amb(absos[0].resta(absos[1]).abs(), neg1)]];
            const possibles = tipus.filter(([, v]) => !v.zero && !v.igual(S));
            if (!possibles.length) return null;
            const [quin, v] = tria(r, possibles);
            const fet = k === 'x' ? X(v) : N(v);
            let posat = false;
            const nou = bo[c].map(t => {
                if (t.k !== k || posat) return t;
                posat = true;
                return fet;
            });
            if (!posat) nou.push(fet); // la suma bona era 0 i no s'havia escrit
            const resultat = bo[c].find(t => t.k === k);
            return {
                linia: c === 'L' ? linia(nou, bo.R) : linia(bo.L, nou),
                dades: {
                    tipus: quin,
                    expr: sumaTx(abans),
                    a: ambSigne(abans[0]),
                    b: ambSigne(abans[1]),
                    bo: resultat ? pTx(resultat) : '0',
                    mal: pTx(fet),
                    altres: opcions.filter(o => o !== triada).map(o => sumaTx(o[2])),
                    clau: clauCalcul(k, [v1, v2]),
                },
            };
        },
        expl(d) {
            if (d.tipus === 'suma') return `$${d.expr}$ no fa $${d.mal}$: quan els dos termes tenen signes diferents, no se sumen els seus valors.`;
            if (d.tipus === 'resta') return `$${d.expr}$ no fa $${d.mal}$: quan els dos termes tenen el mateix signe, els seus valors se sumen.`;
            return `$${d.expr}$ no fa $${d.mal}$.`;
        },
    },
    OPERACIO_INVERSA: {
        // Erbaş et al. (2009): x = N − M o M − N (YK06), x = M·N (YK03), x = M + N (YK05)
        op: 'div',
        pes: 4,
        fes(l, r) {
            if (!aplica('div', l)) return null;
            const A = l.L[0].c.n,
                B = l.R[0].v.n;
            if (Math.abs(A) < 2) return null;
            // la resta al revés, sobretot quan el coeficient és més gran (l'alumne evita la fracció)
            const variants = ['resta', 'resta', 'producte', 'suma', ...(Math.abs(A) > Math.abs(B) ? ['inversa', 'inversa'] : ['inversa'])];
            const v = tria(r, variants);
            const W = { resta: B - A, inversa: A - B, producte: A * B, suma: A + B }[v];
            if (W === 0) return null;
            return { linia: linia([X(1)], [N(W)]), dades: { A, B, v, W } };
        },
        expl(d) {
            const fet = { resta: 'Ha restat', inversa: 'Ha restat', producte: 'Ha multiplicat', suma: 'Ha sumat' }[d.v || 'resta'];
            return `El $${menys(d.A)}$ multiplica la $x$: per aïllar-la s'han de dividir els dos membres entre $${menys(d.A)}$. ${fet}.`;
        },
    },
    COEFICIENT_OBLIDAT: {
        // Erbaş et al. (2009), YK01: 3x = 12 → x = 12 (51 observacions)
        op: 'div',
        pes: 3,
        fes(l) {
            if (!aplica('div', l)) return null;
            const A = l.L[0].c.n,
                B = l.R[0].v.n;
            if (Math.abs(A) < 2 || B === 0) return null;
            return { linia: linia([X(1)], [N(B)]), dades: { A, B } };
        },
        expl(d) {
            return `El $${menys(d.A)}$ multiplica la $x$: per deixar-la sola s'han de dividir els dos membres entre $${menys(d.A)}$, i el $${menys(d.A)}$ ha desaparegut sense dividir.`;
        },
    },
    DIVISIO_SIGNE: {
        op: 'div',
        pes: 1,
        fes(l) {
            if (!aplica('div', l)) return null;
            const A = l.L[0].c.n,
                B = l.R[0].v.n;
            if (A >= 0 || B === 0) return null;
            const L = [X(1)];
            return { linia: linia(L, [A === -1 ? N(B) : F(B, -A)]), dades: { A, B } };
        },
        expl(d) {
            return `El coeficient de la $x$ és $${menys(d.A)}$: s'ha de dividir entre $${menys(d.A)}$, amb el seu signe.`;
        },
    },
    QUOCIENT_INVERTIT: {
        op: 'div',
        pes: 1,
        fes(l) {
            if (!aplica('div', l)) return null;
            const A = l.L[0].c.n,
                B = l.R[0].v.n;
            if (Math.abs(A) < 2 || B === 0 || Math.abs(A) === Math.abs(B)) return null;
            return { linia: linia([X(1)], [F(A, B)]), dades: { A, B } };
        },
        expl(d) {
            // el cas «bessó» (el David, banc d'errades): 12x = 3 → x = 12/3, perquè «3 entre 12 no es pot fer»
            if (Math.abs(d.A) > Math.abs(d.B))
                return `Per aïllar la $x$ s'ha de dividir el terme independent entre el coeficient: $${menys(d.B)} : ${d.A < 0 ? '(' + menys(d.A) + ')' : d.A}$. Que el numerador sigui més petit no vol dir que no es pugui fer: dona una fracció.`;
            return `Per aïllar la $x$ s'ha de dividir el terme independent entre el coeficient de la $x$, i ha dividit al revés.`;
        },
    },
};
// ---------- «Per què és una errada?»: una frase certa i distractors versemblants ----------
// Cada funció torna { bona, dolentes } amb frases concretes de la línia (mai la línia bona sencera).
const resta = (B, A) => `${menys(B)} − ${A < 0 ? '(' + menys(A) + ')' : A}`;
const ambS = n => (n > 0 ? '+' + n : menys(n));
const PERQUE = {
    DISTRIBUTIVA(d) {
        const c = menys(d.t.c),
            b = menys(d.t.b),
            x = d.t.m === 1 ? 'la $x$' : `$${d.t.m}x$`;
        return {
            bona: `Ha multiplicat el $${c}$ per ${x}, però no pel $${b}$.`,
            dolentes: [
                `Ha multiplicat el $${c}$ pel $${b}$, però no per ${x}.`,
                `El $${c}$ s'havia de sumar a cada terme del parèntesi, i no multiplicar-hi.`,
                `Ha canviat el signe del $${b}$, i no l'havia de canviar.`,
            ],
        };
    },
    DIST_SIGNE(d) {
        const c = menys(d.t.c),
            b = menys(d.t.b),
            x = d.t.m === 1 ? 'la $x$' : `$${d.t.m}x$`,
            delX = d.t.m === 1 ? 'de la $x$' : `del $${d.t.m}x$`;
        if (d.t.c === -1)
            return {
                bona: `El signe $−$ de davant del parèntesi havia de canviar el signe del $${b}$, i no l'ha canviat.`,
                dolentes: [
                    `El signe $−$ de davant del parèntesi no ha canviat el signe ${delX}.`,
                    `El signe $−$ de davant del parèntesi només havia de canviar el signe ${delX}.`,
                    `Havia de canviar el signe de tots els termes de l'equació.`,
                ],
            };
        return {
            bona: `Ha multiplicat el $${c}$ pel $${b}$ i s'ha equivocat en el signe del resultat.`,
            dolentes: [
                `Ha multiplicat el $${c}$ per ${x} i s'ha equivocat en el signe.`,
                `No havia de multiplicar el $${b}$: només es multiplica ${x}.`,
                `Havia de canviar el signe de tots els termes de l'equació.`,
            ],
        };
    },
    SIGNE_TRANSPOSAR(d) {
        if (d.tots)
            return {
                bona: `Ha passat ${llistaTermes(d.tots)} a l'altre membre sense canviar-los el signe.`,
                dolentes: [
                    `Ha canviat el signe dels termes que es quedaven al seu membre.`,
                    `Els termes havien de passar a l'altre membre dividint.`,
                    `Havia de passar tots els termes, també els nombres, al membre de l'esquerra.`,
                    `Havia de sumar els termes de cada membre abans de passar-los a l'altre.`,
                ],
            };
        const t = ambSigne(d.t);
        const u = d.altres && d.altres[0];
        return {
            bona: `Ha passat el $${t}$ a l'altre membre sense canviar-li el signe.`,
            dolentes: [
                u
                    ? `Ha canviat el signe del $${ambSigne(u)}$ en passar-lo a l'altre membre, i no l'havia de canviar.`
                    : `Ha passat el $${t}$ a l'altre membre, però l'havia de deixar on era.`,
                `El $${t}$ havia de passar a l'altre membre dividint.`,
                `Havia de passar tots els termes, també els nombres, al membre de l'esquerra.`,
                `Havia de sumar els termes de cada membre abans de passar-los a l'altre.`,
            ],
        };
    },
    SUMA_ABANS_PRODUCTE(d) {
        const par = `${d.t.m === 1 ? '' : d.t.m}x ${d.t.b < 0 ? '−' : '+'} ${Math.abs(d.t.b)}`;
        return {
            bona: `Ha sumat $${d.a} + ${d.t.c}$ abans de multiplicar: el $${d.t.c}$ només multiplica el parèntesi.`,
            dolentes: [
                `El $${d.a}$ també s'havia de multiplicar per $(${par})$.`,
                `Primer s'havia de sumar $${d.a} + ${d.t.c}$ i després multiplicar.`,
                `Ha multiplicat bé, però s'ha equivocat en un signe.`,
                `El $${d.t.c}$ s'havia de sumar a cada terme del parèntesi.`,
            ],
        };
    },
    INVERS_X(d) {
        const B = d.B < 0 ? '(' + menys(d.B) + ')' : d.B;
        return {
            bona: `Ha multiplicat $${menys(d.a)} · ${B}$, però la $x$ era al denominador: havia de dividir $${menys(d.a)} : ${B}$.`,
            dolentes: [`El $${menys(d.B)}$ havia de passar a l'altre membre restant.`, `Havia de multiplicar el $${menys(d.a)}$ per la $x$.`, `Ha calculat malament $${menys(d.a)} · ${B}$.`],
        };
    },
    CANVI_SIGNE_PARCIAL(d) {
        return {
            bona: `Ha canviat el signe de tots els termes menys el del $${ambSigne(d.t)}$.`,
            dolentes: [`Només s'havien de canviar els signes del membre de l'esquerra.`, `Els termes en $x$ no havien de canviar de signe.`, `Ha passat un terme a l'altre membre sense canviar-li el signe.`],
        };
    },
    DENOMINADORS(d) {
        const comuns = [`S'ha equivocat en calcular el mínim comú múltiple dels denominadors.`, `Havia de dividir per $${d.M}$, i no multiplicar.`];
        if (d.variant === 'signe')
            return { bona: `El $−$ de davant de la fracció no ha canviat el signe del $${menys(d.t.b)}$.`, dolentes: [`No ha multiplicat per $${d.M}$ els termes que no tenen denominador.`, ...comuns] };
        return { bona: `No ha multiplicat per $${d.M}$ els termes que no tenen denominador.`, dolentes: [`El $−$ de davant d'una fracció havia de canviar el signe de tot el numerador.`, ...comuns] };
    },
    DIST_SUMA(d) {
        const c = menys(d.t.c),
            b = menys(d.t.b),
            mx = `${d.t.m}x`;
        return {
            bona: `Ha sumat el $${Math.abs(d.t.c)}$ i el $${d.t.m}$ de $${mx}$, i els havia de multiplicar.`,
            dolentes: [
                `Ha multiplicat el $${c}$ per $${mx}$, però no pel $${b}$.`,
                `S'ha equivocat en el signe del terme en $x$.`,
                `S'ha equivocat multiplicant el $${c}$ pel $${b}$.`,
                `Havia de sumar el $${c}$ a cada terme del parèntesi.`,
            ],
        };
    },
    COEFICIENT_U(d) {
        const neg = d.u.c.n < 0,
            ux = neg ? '−x' : 'x';
        return {
            bona: `No ha comptat la $${ux}$: la $${ux}$ vol dir $${neg ? '−1x' : '1x'}$.`,
            dolentes: [
                `Ha calculat $${d.expr}$ i s'ha equivocat en el signe del resultat.`,
                `Ha sumat termes que no són semblants.`,
                neg ? `Ha sumat la $x$ en lloc de restar-la.` : `Ha restat la $x$ en lloc de sumar-la.`,
                `Ha comptat la $${ux}$ dues vegades.`,
            ],
        };
    },
    SIGNE_COPIAT(d) {
        if (d.ts && d.ts.length > 1)
            return {
                bona: `Ha copiat ${llistaTermes(d.ts)} de la línia de sobre amb el signe canviat.`,
                dolentes: [
                    `Ha passat ${llistaTermes(d.ts)} a l'altre membre sense canviar-los el signe.`,
                    `${llistaTermes(d.ts, true)} havien de canviar de signe, i els ha deixat igual.`,
                    `S'ha equivocat sumant dos nombres d'aquesta línia.`,
                ],
            };
        const t = ambSigne(d.t);
        const propi = {
            exp: `El $${t}$ també quedava multiplicat pel nombre de davant del parèntesi.`,
            red1: `Ha sumat el $${t}$ amb un terme que no era semblant.`,
            tra: `El $${t}$ havia de passar a l'altre membre.`,
        }[d.op];
        return {
            bona: `Ha copiat el $${t}$ de la línia de sobre amb el signe canviat.`,
            dolentes: [
                `Ha passat el $${t}$ a l'altre membre sense canviar-li el signe.`,
                `El $${t}$ havia de canviar de signe, i l'ha deixat igual.`,
                propi,
                `S'ha equivocat sumant dos nombres d'aquesta línia.`,
            ],
        };
    },
    TERMES_NO_SEMBLANTS(d) {
        if (d.tres) {
            const n = d.ns.length === 1 ? ambSigne(d.ns[0]) : null;
            return {
                bona: n ? `Ha sumat el $${n}$ amb els termes en $x$, però el $${n}$ no té $x$.` : `Ha sumat els nombres amb els termes en $x$, però els nombres no tenen $x$.`,
                dolentes: [
                    `Ha passat ${n ? `el $${n}$` : 'els nombres'} a l'altre membre sense canviar-${n ? 'li' : 'los'} el signe.`,
                    `Havia de multiplicar els termes en $x$, i no sumar-los.`,
                    `Els termes en $x$ no es podien sumar perquè no són l'un al costat de l'altre.`,
                    `${n ? `El $${n}$` : 'Cada nombre'} s'havia de multiplicar per la $x$.`,
                ],
            };
        }
        const x = pTx(d.x),
            n = pTx(d.n),
            c = d.x.c.n,
            b = d.n.v.n;
        return {
            bona: `Ha sumat $${x}$ i $${n}$ com si fossin termes semblants, però un té $x$ i l'altre no.`,
            dolentes: [
                `Ha passat el $${ambSigne(d.n)}$ a l'altre membre sense canviar-li el signe.`,
                `S'ha equivocat en el càlcul: $${sumaTx([N(c), N(b)])}$ no fa $${menys(c + b)}$.`,
                `Havia de multiplicar $${x}$ per $${n}$.`,
            ],
        };
    },
    CALCUL(d) {
        const frases = {
            signe: `Ha calculat $${d.expr}$ i s'ha equivocat en el signe del resultat.`,
            suma: `Els termes $${d.a}$ i $${d.b}$ tenen signes diferents, però els ha sumat com si tinguessin el mateix signe.`,
            resta: `Els termes $${d.a}$ i $${d.b}$ tenen el mateix signe, però els ha restat com si tinguessin signes diferents.`,
        };
        const dolentes = Object.entries(frases)
            .filter(([k]) => k !== d.tipus)
            .map(([, f]) => f);
        dolentes.push(`Ha sumat termes que no són semblants.`, `En lloc de sumar, havia de multiplicar: $${d.expr}$ és un producte.`);
        for (const a of d.altres || []) dolentes.push(`S'ha equivocat en el càlcul de $${a}$.`);
        return { bona: frases[d.tipus], dolentes };
    },
    OPERACIO_INVERSA(d) {
        const v = d.v || 'resta';
        const A = d.A < 0 ? '(' + menys(d.A) + ')' : String(d.A);
        const fet = {
            resta: resta(d.B, d.A),
            inversa: `${menys(d.A)} − ${d.B < 0 ? '(' + menys(d.B) + ')' : d.B}`,
            producte: `${menys(d.B)} · ${A}`,
            suma: `${menys(d.B)} + ${A}`,
        }[v];
        const W = d.W ?? d.B - d.A;
        const nom = { resta: 'una resta', inversa: 'una resta', producte: 'un producte', suma: 'una suma' }[v];
        return {
            bona: `Ha decidit fer $${fet}$, però hauria d'haver fet ${'$'}{${menys(d.B)}|${menys(d.A)}}$.`,
            dolentes: [
                v === 'suma' ? `Ha decidit fer una suma, però havia de fer una resta.` : `Ha decidit fer ${nom}, però havia de fer una suma.`,
                `Havia de fer $${fet}$, però el resultat és $${ambS(-W)}$.`,
                `El resultat és $${Math.abs(d.A)}${Math.abs(d.B)}$.`,
            ],
        };
    },
    COEFICIENT_OBLIDAT(d) {
        const A = menys(d.A);
        return {
            bona: `Ha tret el $${A}$ de davant de la $x$ sense dividir-hi.`,
            dolentes: [
                `Ha dividit al revés: ${'$'}{${A}|${menys(d.B)}}$.`,
                `Havia de restar el $${A}$ als dos membres.`,
                `Ha multiplicat el $${menys(d.B)}$ pel $${A}$.`,
            ],
        };
    },
    DIVISIO_SIGNE(d) {
        return {
            bona: `Ha dividit entre $${Math.abs(d.A)}$, però havia de dividir entre $${menys(d.A)}$.`,
            dolentes: [
                `Havia de multiplicar per $${menys(d.A)}$, i no dividir.`,
                `Havia de restar $${menys(d.A)}$ als dos membres.`,
                `Havia de dividir al revés: ${'$'}{${menys(d.A)}|${menys(d.B)}}$.`,
            ],
        };
    },
    QUOCIENT_INVERTIT(d) {
        return {
            bona: `Ha fet ${'$'}{${menys(d.A)}|${menys(d.B)}}$, però havia de fer ${'$'}{${menys(d.B)}|${menys(d.A)}}$.`,
            dolentes: [
                `Havia de fer $${resta(d.B, d.A)}$.`,
                `Havia de fer $${menys(d.B)} · ${d.A < 0 ? '(' + menys(d.A) + ')' : d.A}$.`,
                `La divisió està ben plantejada, però s'havia de simplificar abans.`,
            ],
        };
    },
};

const opsDe = regla => (Array.isArray(regla.op) ? regla.op : [regla.op]);

// ---------- Per què cada línia bona és bona (F1) ----------
function perQueBona(op, abans, despres) {
    // El que s'ha escrit de nou en aquesta línia, tal com hi apareix
    let escrit = [];
    switch (op) {
        case 'exp':
            escrit = [...abans.L, ...abans.R]
                .filter(t => t.k === 'p')
                .map(t => sumaTx([X(t.c * t.m), N(t.c * t.b)].filter((u, k) => k === 0 || !u.v.zero)));
            break;
        case 'red1':
        case 'red2':
            for (const c of ['L', 'R'])
                for (const k of ['x', 'n'])
                    if (abans[c].filter(t => t.k === k).length > 1) {
                        const r = despres[c].find(t => t.k === k);
                        escrit.push(r ? pTx(r) : '0');
                    }
            break;
        case 'tra':
            escrit = [...abans.R.filter(esX), ...abans.L.filter(t => esN(t) && !t.v.zero)].map(t => ambSigne(negT(t)));
            break;
        case 'div':
            escrit = [cos(despres.R[0])[1]];
            break;
        case 'simp':
            escrit = [termeTxt(despres.R[0], true)];
            break;
        case 'den':
        case 'neg':
        case 'inv':
            escrit = [text(despres)];
            break;
    }
    const parts = escrit.map((e, k) => (k === 0 ? `és correcte haver escrit $${e}$` : `també és correcte haver escrit $${e}$`));
    const llista = parts.length > 1 ? parts.slice(0, -1).join(', ') + ' i ' + parts[parts.length - 1] : parts[0] || 'tot és correcte';
    return `En aquesta línia no s'ha comès cap errada:\n${llista}.`;
}

// ---------- Enunciats ----------
// nivell 1: ax + b = c, ax + b = dx + e, ax + b + cx = e (4–6 línies)
// nivell 2: amb parèntesis (6–8 línies); la forma H porta un coeficient a dins: x − 2·(3x + 6)
function enunciat(r, nivell) {
    const s = r() < (nivell === 1 ? 0.75 : 0.8) ? signe(r) * enter(r, 1, 9) : null; // solució entera o fraccionària
    if (nivell === 1) {
        const forma = tria(r, ['A', 'A', 'B', 'G', 'I']);
        const a = enter(r, 2, 9);
        if (forma === 'I') {
            // a/x + c = d (el David, 26/11/2026: 30/x = 5): la x al denominador, solució entera
            const B = enter(r, 2, 9) * (r() < 0.8 ? 1 : -1),
                x = s !== null ? s : signe(r) * enter(r, 2, 9),
                c = signe(r) * enter(r, 1, 9);
            const A = B * x;
            if (Math.abs(A) > 60 || B + c === 0) return null;
            return linia([I(A), N(c)], [N(B + c)]);
        }
        if (forma === 'G') {
            // dos termes en x al mateix membre (el David, lot 1, B16: 2x + 3 + 4x = 18)
            // un 30 % amb una x sola (x vol dir 1x: COEFICIENT_U)
            const c = (r() < 0.3 ? 1 : enter(r, 1, 9)) * signe(r);
            const A = a + c;
            if (Math.abs(A) < 2) return null;
            const b = signe(r) * enter(r, 1, 15);
            const B = s !== null ? A * s : fraccionari(r, A);
            if (B + b === 0) return null;
            return linia([X(a), N(b), X(c)], [N(B + b)]);
        }
        if (forma === 'A') {
            const b = signe(r) * enter(r, 1, 15);
            const B = s !== null ? a * s : fraccionari(r, a);
            return linia([X(a), N(b)], [N(B + b)]);
        }
        const d = (r() < 0.3 ? 1 : enter(r, 1, 9)) * signe(r); // un 30 % amb una x sola
        const A = a - d;
        if (Math.abs(A) < 2) return null;
        const b = signe(r) * enter(r, 1, 15);
        const B = s !== null ? A * s : fraccionari(r, A);
        return linia([X(a), N(b)], [X(d), N(B + b)]);
    }
    const forma = tria(r, ['C', 'D', 'E', 'F', 'H', 'K', 'L']);
    const c = enter(r, 2, 6),
        b = signe(r) * enter(r, 1, 9);
    if (forma === 'K') {
        // −ax + b − cx = d − ex: comença amb termes en x negatius, i es canvien tots els signes (CANVI_SIGNE_PARCIAL)
        const a = enter(r, 2, 6),
            c2 = enter(r, 1, 5),
            e = enter(r, 1, 5),
            b2 = signe(r) * enter(r, 1, 12);
        const A = -a - c2 + e;
        if (Math.abs(A) < 2) return null;
        const B = s !== null ? A * s : fraccionari(r, A);
        const d = B + b2;
        if (d === 0) return null;
        return linia([X(-a), N(b2), X(-c2)], [N(d), X(-e)]);
    }
    if (forma === 'L') {
        // (m1x + b1)/d1 ∓ (m2x + b2)/d2 = ex (+ f): treure denominadors (DENOMINADORS)
        const [d1, d2] = tria(r, [[2, 3], [3, 2], [3, 4], [4, 3], [2, 5], [4, 6], [2, 4]]);
        const Mx = (d1 * d2) / mcd(d1, d2),
            k1 = Mx / d1,
            k2 = Mx / d2;
        const m1 = enter(r, 1, 4),
            m2 = enter(r, 1, 3),
            b1 = signe(r) * enter(r, 1, 9),
            b2 = signe(r) * enter(r, 1, 9),
            s2 = r() < 0.75 ? -1 : 1,
            e = signe(r) * enter(r, 1, 3),
            f = r() < 0.4 ? signe(r) * enter(r, 1, 5) : 0;
        const A = m1 * k1 + s2 * m2 * k2 - e * Mx,
            B = f * Mx - b1 * k1 - s2 * b2 * k2;
        // (sense que els termes en x de les dues fraccions s'anul·lin: 6x − 6x)
        if (Math.abs(A) < 2 || B === 0 || Math.abs(e * Mx) > 40 || m1 * k1 === m2 * k2) return null;
        return linia([D(1, m1, b1, d1), D(s2, m2, b2, d2)], f ? [X(e), N(f)] : [X(e)]);
    }
    if (forma === 'H') {
        // ax + c·(mx + b) = dx + e, amb un coeficient a dins del parèntesi (el David, errades reals:
        // x − 2·(3x + 6) = 3x + 7)
        const m = enter(r, 2, 4),
            k = signe(r) * enter(r, 2, 5),
            a = tria(r, [1, 1, -1, 2, 3, -2]),
            d = signe(r) * enter(r, 1, 6);
        const A = a + k * m - d;
        if (Math.abs(A) < 2) return null;
        const B = s !== null ? A * s : fraccionari(r, A);
        return linia([X(a), P(k, b, m)], [X(d), N(B + k * b)]);
    }
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
        // e − c(x + b) o, un 40 %, e + c(x + b): amb el +, l'alumne pot sumar e + c abans de multiplicar
        // (SUMA_ABANS_PRODUCTE, el David, banc d'errades, 26/11/2026)
        const k = r() < 0.4 ? c : -c;
        const A = k - d;
        if (Math.abs(A) < 2) return null;
        const B = s !== null ? A * s : fraccionari(r, A);
        // e + k(x + b) = dx + f  →  k x + (e + k b) = d x + f
        return linia([N(e), P(k, b)], [X(d), N(B + e + k * b)]);
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

const LIMITS = { 1: [4, 6], 2: [6, 8] };
const NOMS = ['la Marta', 'en Pau', 'la Laia', "l'Arnau", 'la Júlia', 'en Marc', 'la Noa', "l'Èric", 'la Carla', 'en Biel', "l'Aina", 'en Pol'];
const dinsMarge = l => [...l.L, ...l.R].every(t => {
    if (t.k === 'x') return Math.abs(t.c.n) <= 40 && t.c.d === 1;
    if (t.k === 'n') return Math.abs(t.v.n) <= 120 && t.v.d <= 40;
    if (t.k === 'p') return Math.abs(t.c) <= 9 && Math.abs(t.b) <= 20 && t.m <= 5;
    if (t.k === 'i') return Math.abs(t.a) <= 120;
    if (t.k === 'd') return t.m <= 9 && Math.abs(t.b) <= 20 && t.den <= 12;
    if (t.k === 'm') return Math.abs(t.a) <= 120 && Math.abs(t.b) <= 40;
    return Math.abs(t.num) <= 120 && Math.abs(t.den) <= 40;
});

/** Un «+ 0» en un membre amb més termes (dx + 0): l'enunciat no s'escriuria així. */
const zeroSobrer = l => [l.L, l.R].some(ts => ts.length > 1 && ts.some(t => t.k === 'n' && t.v.zero));

// ---------- Injecció ----------
/**
 * Versemblança (el David, 26/11/2026): si en un pas anterior a j l'alumne ja ha agrupat bé un membre on hi havia
 * termes en x i nombres barrejats (15 − 4x + 8 → 23 − 4x), ja sap que no són semblants: no és creïble que a la
 * línia j els sumi (23 − 4x → 19x). Aleshores TERMES_NO_SEMBLANTS no s'injecta a j.
 */
export function jaDistingeix(linies, j) {
    const barrejat = ts => ts.some(esX) && ts.some(t => esN(t) && !t.v.zero);
    for (let i = 1; i < j; i++)
        for (const c of ['L', 'R']) {
            const a = linies[i - 1][c],
                b = linies[i][c];
            if (barrejat(a) && b.length < a.length && barrejat(b)) return true;
        }
    return false;
}
/** Un càlcul de dos termes del mateix tipus, sense importar l'ordre: «n:−3,15». */
const clauCalcul = (k, vs) => k + ':' + vs.map(v => `${v.n}/${v.d}`).sort().join(',');
/** Els passos anteriors a j que són correctes (la línia és equivalent a la de sobre) i d'alguna de les operacions ops. */
const passosBons = (linies, ops, j, quines) => {
    const out = [];
    for (let i = 1; i < j; i++) if (quines.includes(ops[i]) && equivalents(linies[i - 1], linies[i])) out.push(i);
    return out;
};
/**
 * Versemblança (el David, 26/11/2026, artifact «Versemblança de les errades»): una errada no s'injecta a la línia j
 * si en un pas anterior correcte l'alumne ja ha demostrat que sap fer just això.
 * - TERMES_NO_SEMBLANTS (A, ja fet): jaDistingeix.
 * - COEFICIENT_U (A2): en un pas anterior ha sumat bé termes en x d'un membre on n'hi havia una de sola.
 * - CALCUL (A3): el mateix càlcul (mateixos dos valors i signes) ja s'ha fet bé abans. Els altres càlculs, sí.
 * La resta de regles no es filtren (B1–B5: no hi ha cap pas anterior que ho demostri, o la distracció és real).
 */
export function versemblant(id, linies, ops, j, res) {
    if (id === 'TERMES_NO_SEMBLANTS') return !jaDistingeix(linies, j);
    if (id === 'COEFICIENT_U') {
        const u1 = t => esX(t) && t.c.abs().igual(q(1));
        return !passosBons(linies, ops, j, ['red1', 'red2']).some(i =>
            ['L', 'R'].some(c => {
                const xs = linies[i - 1][c].filter(esX);
                return xs.length >= 2 && xs.some(u1) && linies[i][c].filter(esX).length < xs.length;
            }),
        );
    }
    if (id === 'CALCUL' && res && res.dades && res.dades.clau) {
        const fets = new Set();
        for (const i of passosBons(linies, ops, j, ['red1', 'red2']))
            for (const c of ['L', 'R'])
                for (const k of ['x', 'n']) {
                    const a = linies[i - 1][c].filter(t => t.k === k);
                    if (a.length === 2 && linies[i][c].filter(t => t.k === k).length < 2) fets.add(clauCalcul(k, a.map(t => (k === 'x' ? t.c : t.v))));
                }
        return !fets.has(res.dades.clau);
    }
    return true;
}
const NOVES = ['INVERS_X', 'CANVI_SIGNE_PARCIAL', 'DENOMINADORS'];
function candidates(r, linies, ops, des = 1) {
    const out = [];
    for (let j = Math.max(1, des); j < linies.length; j++) {
        const op = ops[j];
        for (const [id, regla] of Object.entries(REGLES)) {
            if (!opsDe(regla).includes(op)) continue;
            if (id === 'TERMES_NO_SEMBLANTS' && jaDistingeix(linies, j)) continue;
            // les línies amb termes nous (a/x, fraccions amb binomi, a·b) només admeten les regles que hi pensen
            if ([...linies[j - 1].L, ...linies[j - 1].R].some(t => 'idm'.includes(t.k)) && !NOVES.includes(id)) continue;
            const res = regla.fes(linies[j - 1], r, op);
            if (!res || !versemblant(id, linies, ops, j, res)) continue;
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
 * @param {object} [o.e0]        (eines del banc) un enunciat fix, fet amb T.linia(...)
 * @param {function} [o.filtre]  (eines del banc) quines injeccions s'accepten: c => bool,
 *                               amb c = { j, id, op, res: { linia, dades } }
 * @param {object} TIPUS         data/errors.json (textos genèrics de «Per què?»)
 */
export function generaExemple({ llavor, nivell = 1, errades = 1, compensades = false, e0: fix = null, filtre = null }, TIPUS) {
    const r = creaAtzar(llavor);
    // amb un enunciat fix (eines del banc i del banc d'errades), el nombre de línies és el que surti
    const [mn, mx] = fix ? [2, 20] : LIMITS[nivell] || LIMITS[1];
    for (let intent = 0; intent < 400; intent++) {
        const e0 = fix || enunciat(r, nivell);
        if (!e0 || !solucio(e0) || !dinsMarge(e0) || zeroSobrer(e0)) continue;
        const passos = resol(e0);
        let linies = [e0, ...passos.map(p => p.linia)];
        let ops = [null, ...passos.map(p => p.op)];
        if (!linies.every(dinsMarge)) continue;
        const marques = [];
        let ok = true;
        if (compensades && errades === 2) {
            const parells = [];
            const passa = c => !filtre || filtre(c);
            for (const c1 of candidates(r, linies, ops).filter(passa)) {
                const p1 = injecta(linies, ops, c1);
                for (const c2 of candidates(r, p1.linies, p1.ops, c1.j + 1).filter(passa)) {
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
                if (filtre) cs = cs.filter(filtre);
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
        // (amb un enunciat fix, triat a mà, no es miren els marges: 30/x = 5 → x = 150)
        if (!ok || linies.length < mn || linies.length > mx || (!fix && !linies.every(dinsMarge))) continue;
        if (!compensades && errades === 2 && solucio(linies[linies.length - 1]).igual(solucio(e0))) continue;
        const ex = construeix(r, llavor, nivell, e0, linies, ops, marques, compensades, TIPUS);
        if (valida(ex).length === 0) return ex;
    }
    throw new Error(`No s'ha pogut generar cap exemple (llavor ${llavor}, nivell ${nivell})`);
}
/** Per fer enunciats fixos (eines del banc): T.linia([T.X(8), T.N(-15)], [T.X(-4), T.N(-3)]). */
export const T = { X, N, P, I, D, linia };

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
        const marca = c.res.dades && c.res.dades.marca; // la regla ja diu quins termes s'han d'encerclar
        if (terme < 0) terme = malF.findIndex(t => t !== '=');
        // dos termes equivocats (SIGNE_TRANSPOSAR o SIGNE_COPIAT amb dos termes): a la fase del terme valen tots dos
        if (marca) terme = marca[0];
        const termes = marca ? marca : bonaF.length === malF.length ? malF.map((t, i) => (t !== '=' && t !== bonaF[i] ? i : -1)).filter(i => i >= 0) : [terme];
        // «Per què?»: la frase certa i tres de falses, concretes d'aquesta línia
        const fr = PERQUE[c.id](c.res.dades);
        const perque = barreja(r, [[fr.bona, true], ...barreja(r, fr.dolentes).slice(0, 3).map(t => [t, false])]);
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
            ...(termes.length > 1 ? { termes } : {}),
            expl: regla.expl(c.res.dades, bona),
            bona: text(bona),
            fitxesBona: bonaF,
            perque,
            opcions,
        };
    }
    for (let i = 1; i < linies.length; i++) if (!ex.errades[i]) ex.correctes[i] = perQueBona(ops[i], linies[i - 1], linies[i]);
    ex.compensades = !!compensades;
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
    // x = valor: un nombre, o una fracció que ja no se simplifica (x = 4/11 no té pas «simp»)
    const valorFinal = t => esN(t) || (t.k === 'f' && t.den > 1 && mcd(Math.abs(t.num), t.den) === 1);
    if (!(ult.L.length === 1 && esX(ult.L[0]) && ult.L[0].c.n === 1 && ult.L[0].c.d === 1 && ult.R.length === 1 && valorFinal(ult.R[0])))
        p.push("l'última línia no és «x = valor»");
    for (const [j, e] of Object.entries(ex.errades)) {
        if (e.perque.length !== 4 || e.perque.filter(o => o[1]).length !== 1) p.push(`errada ${j}: «Per què?» ha de tenir 4 opcions i una de bona`);
        if (new Set(e.perque.map(o => o[0])).size !== 4) p.push(`errada ${j}: opcions de «Per què?» repetides`);
        if (e.opcions.length !== 3 || e.opcions.filter(o => o[1]).length !== 1) p.push(`errada ${j}: «Corregeix-la» ha de tenir 3 opcions i una de bona`);
        if (new Set(e.opcions.map(o => o[0])).size !== 3) p.push(`errada ${j}: opcions de «Corregeix-la» repetides`);
        if (e.opcions.find(o => o[1])?.[0] !== e.bona) p.push(`errada ${j}: l'opció bona no és la línia bona`);
        if (e.bona === ex.linies[j].join(' ')) p.push(`errada ${j}: la línia bona és igual que la dolenta`);
        if (e.expl.includes(e.bona) || e.expl.includes('$' + e.bona.split(' = ')[1] + '$')) p.push(`errada ${j}: l'explicació ja diu com havia de quedar la línia`);
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
