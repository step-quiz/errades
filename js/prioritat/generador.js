/**
 * ============================================================================
 * PROJECTE: Localitza l'errada (step-quiz/errades)
 * FITXER: js/prioritat/generador.js
 * ROL: Generador pur d'exemples de prioritat d'operacions amb errades: un
 *      alumne fictici calcula una expressió línia a línia, i en una (o dues)
 *      línies aplica una regla errònia; les línies següents es calculen bé a
 *      partir de la línia equivocada.
 * ARQUITECTURA:
 * - Expressió E = [{ o, x }]: o és null (el primer) o '+', '−', '·', ':';
 *   x és { k: 'n', v } (un enter), { k: 'p', e: E } (un parèntesi, sense
 *   parèntesis ni potències a dins) o { k: 'w', b, e } (una potència b^e).
 * - Definició N1: una línia és una errada si no té el mateix valor que l'anterior.
 * - El procediment de l'alumne (pas): en cada línia fa un sol «nivell»:
 *   parèntesis (cada parèntesi avança un pas, tots alhora; quan queda un
 *   nombre, el parèntesi desapareix) → potències (totes) → multiplicacions i
 *   divisions (la primera de cada cadena, totes les cadenes alhora) → sumes i
 *   restes (la primera, d'esquerra a dreta).
 * - Les fitxes d'una línia: l'enunciat sense «=» i les altres «=», «3», «+ 8»…
 *   (js/motor/llibreta.js les alinea pel «=»). Les potències s'escriuen «3^2».
 * - REGLES: les regles errònies (fes torna { E, dades } o null), amb el text de
 *   «Per què?» (PERQUE) i l'explicació (expl), que mai no diu la línia bona.
 * - El format de l'exemple és el de js/equacions/generador.js (el motor és el
 *   mateix): linies, errades {j: {tipus, terme, termes?, expl, bona, fitxesBona,
 *   perque, opcions}}, correctes, nota, solucio, alumne.
 * DEPENDÈNCIES: js/equacions/generador.js (creaAtzar).
 * ============================================================================
 */
import { creaAtzar } from '../equacions/generador.js';

export { creaAtzar };
const enter = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const tria = (r, l) => l[Math.floor(r() * l.length)];
function barreja(r, l) {
    const a = l.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ---------- Expressions ----------
const N = v => ({ k: 'n', v });
const Pa = e => ({ k: 'p', e });
const W = (b, e) => ({ k: 'w', b, e });
const it = (o, x) => ({ o, x });
export const T = { N, Pa, W, it };
const ADD = ['+', '−'],
    MUL = ['·', ':'];
const menys = n => (n < 0 ? '−' + Math.abs(n) : String(n));
const copia = E => JSON.parse(JSON.stringify(E));

function xTxt(x, primer) {
    if (x.k === 'n') return x.v < 0 ? (primer ? menys(x.v) : `(${menys(x.v)})`) : String(x.v);
    if (x.k === 'p') return `(${text(x.e)})`;
    return `${x.b}^${x.e}`;
}
const fitxa = (item, k) => (k === 0 ? xTxt(item.x, true) : `${item.o} ${xTxt(item.x, false)}`);
export const text = E => E.map(fitxa).join(' ');
/** Les fitxes d'una línia: l'enunciat (i = 0) sense «=»; les altres, començant per «=». */
export const fitxes = (E, enunciat = false) => (enunciat ? E.map(fitxa) : ['=', ...E.map(fitxa)]);
export const textLinia = E => '= ' + text(E);

/** Valor d'una operació; null si la divisió no és exacta. */
function opera(a, o, b) {
    if (o === '+') return a + b;
    if (o === '−') return a - b;
    if (o === '·') return a * b;
    if (b === 0 || a % b !== 0) return null;
    return a / b;
}
function valX(x) {
    if (x.k === 'n') return x.v;
    if (x.k === 'w') return x.b ** x.e;
    return valor(x.e);
}
/** El valor d'una expressió amb la prioritat de sempre (null si hi ha una divisió que no és exacta). */
export function valor(E) {
    // primer les cadenes de · i :, d'esquerra a dreta; després + i −
    const termes = [];
    for (const { o, x } of E) {
        const v = valX(x);
        if (v === null) return null;
        if (o === null || ADD.includes(o)) termes.push([o === '−' ? -1 : 1, v]);
        else {
            const t = termes[termes.length - 1];
            const r = opera(t[1], o, v);
            if (r === null) return null;
            t[1] = r;
        }
    }
    return termes.reduce((s, [sg, v]) => s + sg * v, 0);
}

// ---------- El procediment de l'alumne ----------
export function etapa(E) {
    if (E.some(i => i.x.k === 'p')) return 'par';
    if (E.some(i => i.x.k === 'w')) return 'pot';
    if (E.length > 1 && E.some(i => MUL.includes(i.o))) return 'md';
    if (E.length > 1) return 'as';
    return null;
}
/** Els inicis de cadena de · i : (la posició del primer factor de cada cadena). */
const cadenes = L => L.map((t, s) => s).filter(s => s + 1 < L.length && MUL.includes(L[s + 1].o) && (s === 0 || !MUL.includes(L[s].o)));

/**
 * Un pas d'una llista plana de nombres. h.calc(a, o, b) pot canviar un resultat (per a les regles errònies).
 * Torna { L, fets } o null (divisió no exacta). fets: els resultats nous, en ordre.
 */
function pasLlista(L, h = {}) {
    const calc = (a, o, b) => {
        const v = h.calc ? h.calc(a, o, b) : undefined;
        return v === undefined ? opera(a, o, b) : v;
    };
    const fets = [];
    if (L.some(t => MUL.includes(t.o))) {
        const out = [];
        const cs = new Set(cadenes(L));
        for (let s = 0; s < L.length; s++) {
            if (cs.has(s)) {
                const r = calc(L[s].x.v, L[s + 1].o, L[s + 1].x.v);
                if (r === null) return null;
                out.push(it(L[s].o, N(r)));
                fets.push({ a: L[s].x.v, o: L[s + 1].o, b: L[s + 1].x.v, r });
                s++;
            } else out.push(L[s]);
        }
        return { L: out, fets };
    }
    const r = calc(L[0].x.v, L[1].o, L[1].x.v);
    if (r === null) return null;
    fets.push({ a: L[0].x.v, o: L[1].o, b: L[1].x.v, r });
    return { L: [it(L[0].o, N(r)), ...L.slice(2)], fets };
}
/** Un parèntesi que ja és un nombre desapareix. */
const desfa = E => E.map(t => (t.x.k === 'p' && t.x.e.length === 1 ? it(t.o, N(t.x.e[0].x.v)) : t));

/** Un pas correcte (o amb h.calc, per a les regles). Torna { E, fets, etapa } o null. */
export function pas(E, h = {}) {
    const et = etapa(E);
    if (!et) return null;
    if (et === 'par') {
        const fets = [];
        const out = [];
        for (const t of E) {
            if (t.x.k !== 'p') {
                out.push(t);
                continue;
            }
            const p = pasLlista(t.x.e, h);
            if (!p) return null;
            fets.push(...p.fets);
            out.push(it(t.o, Pa(p.L)));
        }
        return { E: desfa(out), fets, etapa: et };
    }
    if (et === 'pot') {
        const fets = [];
        const out = E.map(t => {
            if (t.x.k !== 'w') return t;
            const v = h.calc ? h.calc(t.x.b, '^', t.x.e) : undefined;
            const r = v === undefined ? t.x.b ** t.x.e : v;
            fets.push({ a: t.x.b, o: '^', b: t.x.e, r });
            return it(t.o, N(r));
        });
        return { E: out, fets, etapa: et };
    }
    const p = pasLlista(E, h);
    return p && { E: p.L, fets: p.fets, etapa: et };
}
/** Tots els passos fins a un sol nombre (null si alguna divisió no és exacta o massa passos). */
export function resol(E) {
    const passos = [];
    let cur = E;
    for (let k = 0; k < 20 && etapa(cur); k++) {
        const p = pas(cur);
        if (!p) return null;
        passos.push(p);
        cur = p.E;
    }
    return etapa(cur) ? null : passos;
}

// ---------- Regles errònies ----------
// Fonts: Tabak (2019), 240 alumnes de 6è a 8è: el 80 % calcula d'esquerra a dreta (6 + 5 × 2 → 11 × 2);
// Bye et al. (2024): els errors de prioritat es multipliquen quan l'operació de l'esquerra no es pot fer primer;
// Universitat de Portsmouth: la lectura «literal» de l'acrònim (la suma abans que la resta).
/** Aplica f a la llista activa (la de dalt o, a l'etapa dels parèntesis, la d'un parèntesi). */
function aLlista(E, r, f) {
    const et = etapa(E);
    if (et === 'md' || et === 'as') {
        const res = f(E);
        return res && { E: res.L, dades: res.dades };
    }
    if (et !== 'par') return null;
    const ps = E.map((t, i) => i).filter(i => E[i].x.k === 'p');
    const prova = barreja(r, ps);
    for (const i of prova) {
        const res = f(E[i].x.e);
        if (!res) continue;
        const out = [];
        for (let k = 0; k < E.length; k++) {
            if (E[k].x.k !== 'p') out.push(E[k]);
            else if (k === i) out.push(it(E[k].o, Pa(res.L)));
            else {
                const p = pasLlista(E[k].x.e);
                if (!p) return null;
                out.push(it(E[k].o, Pa(p.L)));
            }
        }
        return { E: desfa(out), dades: res.dades };
    }
    return null;
}
const opTxt = (a, o, b) => `${a < 0 && MUL.includes(o) ? '(' + menys(a) + ')' : menys(a)} ${o} ${b < 0 ? '(' + menys(b) + ')' : b}`;

export const REGLES = {
    ESQUERRA_DRETA: {
        pes: 5,
        fes(E, r) {
            return aLlista(E, r, L => {
                if (L.length < 3 || !ADD.includes(L[1].o) || !MUL.includes(L[2].o) || L[0].x.k !== 'n' || L[1].x.k !== 'n') return null;
                const v = opera(L[0].x.v, L[1].o, L[1].x.v);
                return { L: [it(L[0].o, N(v)), ...L.slice(2)], dades: { a: L[0].x.v, o: L[1].o, b: L[1].x.v, m: L[2].o, c: L[2].x.v } };
            });
        },
        expl: d => `Les multiplicacions i les divisions van abans que les sumes i les restes: $${opTxt(d.a, d.o, d.b)}$ no es podia fer encara.`,
    },
    SUMA_ABANS_RESTA: {
        pes: 3,
        fes(E, r) {
            return aLlista(E, r, L => {
                if (L.some(t => MUL.includes(t.o))) return null;
                for (let i = 1; i + 1 < L.length; i++)
                    if (L[i].o === '−' && L[i + 1].o === '+' && L[i + 1].x.v !== 0) {
                        const v = L[i].x.v + L[i + 1].x.v;
                        return { L: [...L.slice(0, i), it('−', N(v)), ...L.slice(i + 2)], dades: { a: L[i - 1].x.v, b: L[i].x.v, c: L[i + 1].x.v, primer: i === 1 } };
                    }
                return null;
            });
        },
        expl: () => `Les sumes i les restes es fan d'esquerra a dreta, en l'ordre en què surten: la suma no va abans que la resta.`,
    },
    PRODUCTE_ABANS_DIVISIO: {
        pes: 2,
        fes(E, r) {
            return aLlista(E, r, L => {
                for (let i = 1; i + 1 < L.length; i++)
                    if (L[i].o === ':' && L[i + 1].o === '·' && L[i].x.k === 'n' && L[i + 1].x.k === 'n' && L[i + 1].x.v !== 1) {
                        const v = L[i].x.v * L[i + 1].x.v;
                        return { L: [...L.slice(0, i), it(':', N(v)), ...L.slice(i + 2)], dades: { a: L[i - 1].x.v, b: L[i].x.v, c: L[i + 1].x.v } };
                    }
                return null;
            });
        },
        expl: () => `Les multiplicacions i les divisions es fan d'esquerra a dreta, en l'ordre en què surten: la multiplicació no va abans que la divisió.`,
    },
    PARENTESI_IGNORAT: {
        pes: 3,
        fes(E) {
            if (etapa(E) !== 'par') return null;
            for (let i = 1; i < E.length; i++) {
                const p = E[i].x;
                if (p.k !== 'p' || E[i].o !== '·' || E[i - 1].x.k !== 'n' || p.e.length !== 2 || !ADD.includes(p.e[1].o)) continue;
                const a = E[i - 1].x.v,
                    b = p.e[0].x.v;
                // els altres parèntesis avancen bé, com en un pas correcte
                const altres = t => {
                    if (t.x.k !== 'p') return t;
                    const q = pasLlista(t.x.e);
                    return q ? it(t.o, Pa(q.L)) : t;
                };
                const out = [...E.slice(0, i - 1).map(altres), it(E[i - 1].o, N(a * b)), it(p.e[1].o, p.e[1].x), ...E.slice(i + 1).map(altres)];
                return { E: desfa(out), dades: { a, b, o: p.e[1].o, c: p.e[1].x.v } };
            }
            return null;
        },
        expl: d => `El parèntesi vol dir que primer s'ha de fer $${opTxt(d.b, d.o, d.c)}$: el $${menys(d.a)}$ multiplica tot el parèntesi.`,
    },
    POTENCIA_PER_EXPONENT: {
        // Qui creu que 3² = 3·2 ho aplica a TOTES les potències del pas (el David, 26/11/2026): una de ben feta i una
        // altra com a base·exponent, en el mateix pas, no és versemblant. Les 2^2 (2·2 = 2²) surten igual.
        pes: 4,
        fes(E) {
            if (etapa(E) !== 'pot') return null;
            const ws = E.filter(t => t.x.k === 'w' && t.x.b * t.x.e !== t.x.b ** t.x.e).map(t => ({ b: t.x.b, e: t.x.e }));
            if (!ws.length) return null;
            const p = pas(E, { calc: (a, o, c) => (o === '^' ? a * c : undefined) });
            return p && { E: p.E, dades: { b: ws[0].b, e: ws[0].e, ws } };
        },
        expl: d =>
            d.ws.length > 1
                ? `${d.ws.map(w => `$${w.b}^${w.e}$`).join(' i ')} no volen dir multiplicar la base per l'exponent.`
                : `$${d.b}^${d.e}$ no vol dir multiplicar la base per l'exponent.`,
    },
    POTENCIA_DESPRES: {
        pes: 3,
        fes(E) {
            if (etapa(E) !== 'pot') return null;
            for (let i = 1; i < E.length; i++)
                if (E[i].x.k === 'w' && E[i].o === '·' && E[i - 1].x.k === 'n' && E[i - 1].x.v >= 2) {
                    const a = E[i - 1].x.v,
                        { b, e } = E[i].x;
                    // les altres potències es fan bé, com en un pas correcte
                    const fa = t => (t.x.k === 'w' ? it(t.o, N(t.x.b ** t.x.e)) : t);
                    return { E: [...E.slice(0, i - 1).map(fa), it(E[i - 1].o, W(a * b, e)), ...E.slice(i + 1).map(fa)], dades: { a, b, e } };
                }
            return null;
        },
        expl: d => `La potència va abans que la multiplicació: l'exponent només és del $${d.b}$.`,
    },
    RESTA_NEGATIVA: {
        pes: 2,
        fes(E) {
            let d = null;
            const p = pas(E, {
                calc: (a, o, b) => {
                    // 15 − 27 → 12: dos nombres positius i el segon més gran
                    if (d || o !== '−' || a < 0 || b <= a) return undefined;
                    d = { a, b };
                    return b - a;
                },
            });
            return p && d && { E: p.E, dades: d };
        },
        expl: d => `$${opTxt(d.a, '−', d.b)}$ no fa $${d.b - d.a}$: el nombre que es resta és més gran.`,
    },
    RESTA_GIRADA: {
        // 3 − 8 · 5 → 40 − 3: fa bé el producte, però el posa davant i gira la resta (alumne real del David, 27/11/2026)
        pes: 3,
        fes(E, r) {
            return aLlista(E, r, L => {
                if (L.length < 3 || L[1].o !== '−' || !MUL.includes(L[2].o) || L.slice(0, 3).some(t => t.x.k !== 'n')) return null;
                if (L.slice(3).some(t => MUL.includes(t.o))) return null; // cap altre producte en aquest pas
                const a = L[0].x.v,
                    p = opera(L[1].x.v, L[2].o, L[2].x.v);
                if (p === null || a <= 0 || p <= a) return null; // el gira perquè el resultat li surti positiu
                return { L: [it(L[0].o, N(p)), it('−', N(a)), ...L.slice(3)], dades: { a, b: L[1].x.v, m: L[2].o, c: L[2].x.v, p } };
            });
        },
        expl: d => `Després de fer $${opTxt(d.b, d.m, d.c)} = ${d.p}$, havia de quedar $${d.a} − ${d.p}$: el $${d.p}$ és el que es resta, i no es pot posar davant.`,
    },
    SIGNE_PRODUCTE: {
        pes: 2,
        fes(E) {
            let d = null;
            const p = pas(E, {
                calc: (a, o, b) => {
                    if (d || !MUL.includes(o) || a * b >= 0) return undefined;
                    const r = opera(Math.abs(a), o, Math.abs(b));
                    if (r === null) return undefined;
                    d = { a, o, b, r };
                    return r;
                },
            });
            return p && d && { E: p.E, dades: d };
        },
        expl: d => `$${opTxt(d.a, d.o, d.b)}$ no fa $${d.r}$: si els dos nombres tenen signes diferents, el resultat és negatiu.`,
    },
};

// ---------- «Per què és una errada?» ----------
const nomOp = o => ({ '·': 'la multiplicació', ':': 'la divisió', '+': 'la suma', '−': 'la resta' })[o];
const PERQUE = {
    ESQUERRA_DRETA(d) {
        const fet = opTxt(d.a, d.o, d.b),
            calia = opTxt(d.b, d.m, d.c);
        return {
            bona: `Ha fet $${fet}$ abans que $${calia}$, i ${nomOp(d.m)} va primer.`,
            dolentes: [
                `Ha fet $${calia}$ abans que $${fet}$, i havia d'anar d'esquerra a dreta.`,
                `S'ha equivocat calculant $${fet}$.`,
                `Havia de començar per l'última operació de la línia.`,
                `Ha copiat malament un dels nombres.`,
            ],
        };
    },
    SUMA_ABANS_RESTA(d) {
        const fet = opTxt(d.b, '+', d.c),
            calia = opTxt(d.a, '−', d.b);
        return {
            bona: `Ha fet $${fet}$ abans que $${calia}$, i les sumes i les restes es fan d'esquerra a dreta.`,
            dolentes: [`Havia de fer totes les sumes abans que les restes.`, `S'ha equivocat calculant $${fet}$.`, `Ha copiat malament un dels nombres.`, `Havia de començar per l'última operació de la línia.`],
        };
    },
    PRODUCTE_ABANS_DIVISIO(d) {
        const fet = opTxt(d.b, '·', d.c),
            calia = opTxt(d.a, ':', d.b);
        return {
            bona: `Ha fet $${fet}$ abans que $${calia}$, i les multiplicacions i les divisions es fan d'esquerra a dreta.`,
            dolentes: [`Havia de fer totes les multiplicacions abans que les divisions.`, `S'ha equivocat calculant $${fet}$.`, `Ha copiat malament un dels nombres.`, `Havia de començar per l'última operació de la línia.`],
        };
    },
    PARENTESI_IGNORAT(d) {
        return {
            bona: `No ha tingut en compte el parèntesi: ha multiplicat el $${menys(d.a)}$ només pel $${menys(d.b)}$.`,
            dolentes: [
                `Havia de fer la multiplicació abans que el que hi ha dins del parèntesi.`,
                `S'ha equivocat calculant $${opTxt(d.a, '·', d.b)}$.`,
                `Havia de multiplicar el $${menys(d.a)}$ pel $${menys(d.c)}$, i no pel $${menys(d.b)}$.`,
            ],
        };
    },
    POTENCIA_PER_EXPONENT(d) {
        return {
            bona: d.ws && d.ws.length > 1 ? `Ha multiplicat la base per l'exponent: ha fet ${d.ws.map(w => `$${w.b} · ${w.e}$`).join(' i ')}.` : `Ha multiplicat la base per l'exponent: ha fet $${d.b} · ${d.e}$.`,
            dolentes: [`Ha sumat la base i l'exponent.`, `Havia de fer la potència després de les multiplicacions.`, `Ha fet bé la potència, però s'ha equivocat en una altra operació.`],
        };
    },
    POTENCIA_DESPRES(d) {
        return {
            bona: `Ha multiplicat $${d.a} · ${d.b}$ abans de fer la potència, i l'exponent només és del $${d.b}$.`,
            dolentes: [`Havia de fer la multiplicació abans que la potència.`, `Ha multiplicat la base per l'exponent.`, `S'ha equivocat calculant $${d.a} · ${d.b}$.`],
        };
    },
    RESTA_NEGATIVA(d) {
        return {
            bona: `Ha fet $${opTxt(d.b, '−', d.a)}$ en lloc de $${opTxt(d.a, '−', d.b)}$: el resultat havia de ser negatiu.`,
            dolentes: [`Havia de sumar $${d.a} + ${d.b < 0 ? '(' + menys(d.b) + ')' : d.b}$.`, `Ha fet les operacions en un ordre equivocat.`, `Ha copiat malament un dels nombres.`],
        };
    },
    RESTA_GIRADA(d) {
        return {
            bona: `És una errada escriure $${d.p} − ${d.a}$: havia de ser $${d.a} − ${d.p}$, perquè el $${d.p}$ és el que es resta.`,
            dolentes: [`Ha fet la resta abans que la multiplicació.`, `S'ha equivocat calculant $${opTxt(d.b, d.m, d.c)}$.`, `Ha copiat malament un dels nombres.`],
        };
    },
    SIGNE_PRODUCTE(d) {
        return {
            bona: `S'ha equivocat en el signe del resultat de $${opTxt(d.a, d.o, d.b)}$.`,
            dolentes: [`Ha fet les operacions en un ordre equivocat.`, `Havia de sumar els dos nombres.`, `Ha copiat malament un dels nombres.`],
        };
    },
};

// ---------- Per què una línia bona és bona (F1) ----------
function perQueBona(fets) {
    const parts = fets.map((f, k) => (k === 0 ? `és correcte haver escrit $${menys(f.r)}$` : `també és correcte haver escrit $${menys(f.r)}$`));
    const llista = parts.length > 1 ? parts.slice(0, -1).join(', ') + ' i ' + parts[parts.length - 1] : parts[0] || 'tot és correcte';
    return `Aquesta línia és correcta, perquè\n${llista}.`;
}

// ---------- Enunciats ----------
// forma 1 (nivell 1): naturals, + − · :, sense parèntesis (4–6 línies)
// forma 2 (nivells 2–5): amb parèntesis, potències i algun nombre negatiu (5–8 línies)
function factor(r, forma) {
    if (forma === 2 && r() < 0.18) return N(-enter(r, 2, 9));
    return N(enter(r, 2, 9));
}
function cadena(r, forma, mida) {
    // a · b, a : b (exacta), a · b : c…
    const L = [it(null, factor(r, forma))];
    for (let k = 1; k < mida; k++) {
        const o = r() < 0.6 ? '·' : ':';
        if (o === ':') {
            // el dividend és el que ja hi ha: es busca un divisor exacte de 2 a 9
            const v = valor(L);
            const ds = [2, 3, 4, 5, 6, 7, 8, 9].filter(d => v % d === 0 && Math.abs(v / d) > 1);
            if (ds.length) {
                L.push(it(':', N(tria(r, ds))));
                continue;
            }
            // si no n'hi ha cap, es fa al revés: el primer factor esdevé un múltiple
            const d = enter(r, 2, 6);
            L[0] = it(null, N(L[0].x.v * d));
            if (k === 1) {
                L.push(it(':', N(d)));
                continue;
            }
        }
        L.push(it('·', factor(r, forma)));
    }
    return L;
}
function parentesi(r) {
    const a = enter(r, 1, 12),
        b = enter(r, 1, 9);
    const o = r() < 0.5 ? '+' : '−';
    if (r() < 0.25) return Pa([it(null, N(a)), it(o, N(enter(r, 2, 5))), it('·', N(enter(r, 2, 5)))]);
    return Pa([it(null, N(a)), it(o, N(b))]);
}
function terme(r, forma) {
    const u = r();
    if (u < (forma === 1 ? 0.12 : 0.06)) {
        // a : b · c amb a = b·c·m: també es pot fer (malament) b · c primer
        const b = enter(r, 2, 5),
            c = enter(r, 2, 4),
            m = enter(r, 1, 3);
        return [it(null, N(b * c * m)), it(':', N(b)), it('·', N(c))];
    }
    if (forma === 1) return u < 0.5 ? [it(null, N(enter(r, 2, 20)))] : cadena(r, forma, 2);
    if (u < 0.15) return [it(null, N(enter(r, 2, 20)))];
    if (u < 0.4) {
        // a · (b ± c) o (b ± c) · a
        const p = parentesi(r),
            a = enter(r, 2, 6);
        return r() < 0.7 ? [it(null, N(a)), it('·', p)] : [it(null, p), it('·', N(a))];
    }
    if (u < 0.75) {
        // a · b^2 amb nombres petits: (a·b)^2 també ha de quedar dins del marge (POTENCIA_DESPRES)
        if (r() < 0.5) return [it(null, N(enter(r, 2, 3))), it('·', W(enter(r, 2, 4), 2))];
        return [it(null, r() < 0.75 ? W(enter(r, 2, 5), 2) : W(enter(r, 2, 3), 3))];
    }
    if (u < 0.85) return [it(null, parentesi(r))];
    return cadena(r, forma, 2);
}
export function enunciat(r, forma) {
    const n = forma === 1 ? tria(r, [2, 2, 3, 3, 3]) : tria(r, [2, 3, 3]);
    const E = [];
    // la primera, sovint un nombre sol: així es pot calcular d'esquerra a dreta (l'errada més freqüent)
    for (let k = 0; k < n; k++) {
        let t = k === 0 && r() < (forma === 1 ? 0.55 : 0.35) ? [it(null, N(enter(r, 2, 20)))] : terme(r, forma);
        t = t.map((u, j) => (j === 0 ? it(k === 0 ? null : r() < 0.55 ? '+' : '−', u.x) : u));
        E.push(...t);
    }
    return E;
}
const LIMITS = { 1: [4, 6], 2: [5, 8] };
const NOMS = ['la Marta', 'en Pau', 'la Laia', "l'Arnau", 'la Júlia', 'en Marc', 'la Noa', "l'Èric", 'la Carla', 'en Biel', "l'Aina", 'en Pol'];
/** Nombres raonables a totes les línies; a la forma 1, cap nombre negatiu. */
function dinsMarge(E, forma) {
    const max = forma === 1 ? 120 : 200;
    const ok = x => {
        if (x.k === 'n') return Math.abs(x.v) <= max && (forma === 2 || x.v >= 0);
        if (x.k === 'w') return x.b ** x.e <= max;
        return x.e.every(t => ok(t.x));
    };
    const v = valor(E);
    return v !== null && Math.abs(v) <= max && (forma === 2 || v >= 0) && E.every(t => ok(t.x));
}
const teForma2 = E => E.some(t => t.x.k === 'p' || t.x.k === 'w');
/** Quants nombres té l'enunciat (per no fer-lo massa llarg) i quants parèntesis i potències. */
const nombres = E => E.reduce((s, t) => s + (t.x.k === 'p' ? nombres(t.x.e) : 1), 0);
const especials = E => E.filter(t => t.x.k === 'p' || t.x.k === 'w').length;
/** Tots els nombres de l'enunciat (sense els exponents): el David no vol «4 i −4» ni nombres repetits. */
const llistaNombres = E => E.flatMap(t => (t.x.k === 'p' ? llistaNombres(t.x.e) : t.x.k === 'w' ? [t.x.b] : [Math.abs(t.x.v)]));
const variat = E => new Set(llistaNombres(E)).size === llistaNombres(E).length;

// ---------- Injecció ----------
/**
 * Versemblança (el David, 26/11/2026, artifact «Versemblança de les errades», C1–C5): una errada no s'injecta a la
 * línia j si en un pas anterior correcte (mateix valor que la línia de sobre) l'alumne ja tenia davant el mateix
 * parany (la regla s'hi podia aplicar) i l'ha evitat. Per a PARENTESI_IGNORAT (C6), RESTA_NEGATIVA i SIGNE_PRODUCTE
 * (D1, D2) no: són distraccions reals. El parany es prova amb un atzar a part, perquè no canviï els exemples.
 */
export const FILTRADES = ['ESQUERRA_DRETA', 'SUMA_ABANS_RESTA', 'PRODUCTE_ABANS_DIVISIO', 'POTENCIA_PER_EXPONENT', 'POTENCIA_DESPRES'];
export function versemblant(id, linies, j) {
    if (!FILTRADES.includes(id)) return true;
    for (let i = 1; i < j; i++) {
        if (valor(linies[i]) !== valor(linies[i - 1])) continue;
        if (REGLES[id].fes(linies[i - 1], creaAtzar(i))) return false;
    }
    return true;
}
function candidates(r, linies, des, forma) {
    const out = [];
    for (let j = Math.max(1, des); j < linies.length; j++) {
        const abans = linies[j - 1],
            v = valor(abans);
        for (const [id, regla] of Object.entries(REGLES)) {
            if (!versemblant(id, linies, j)) continue;
            const res = regla.fes(abans, r);
            if (!res) continue;
            const pass = resol(res.E);
            if (!pass || valor(res.E) === v || valor(res.E) === null) continue;
            if (![res.E, ...pass.map(p => p.E)].every(E => dinsMarge(E, forma))) continue;
            out.push({ j, id, res, pass });
        }
    }
    return out;
}
function triaPonderada(r, l) {
    const tot = l.reduce((s, c) => s + REGLES[c.id].pes, 0);
    let x = r() * tot;
    for (const c of l) {
        x -= REGLES[c.id].pes;
        if (x < 0) return c;
    }
    return l[l.length - 1];
}
const injecta = (linies, c) => [...linies.slice(0, c.j), c.res.E, ...c.pass.map(p => p.E)];

/**
 * Un exemple nou (pur i determinista).
 * @param {object} o { llavor, nivell (forma 1 o 2), errades (0–2), compensades, e0?, filtre? }
 */
export function generaExemple({ llavor, nivell = 1, errades = 1, compensades = false, e0: fix = null, filtre = null }) {
    const r = creaAtzar(llavor);
    const forma = nivell === 2 ? 2 : 1;
    // amb un enunciat fix (eines del banc i del banc d'errades), el nombre de línies és el que surti
    const [mn, mx0] = fix ? [2, 20] : LIMITS[forma];
    const mx = mx0 + (errades === 2 ? 1 : 0); // amb dues errades, una línia més
    for (let intent = 0; intent < 1500; intent++) {
        const e0 = fix || enunciat(r, forma);
        if (!fix && forma === 2 && (!teForma2(e0) || especials(e0) > 2 || nombres(e0) > 6)) continue;
        if (!fix && forma === 1 && nombres(e0) > 5) continue;
        if (!fix && !variat(e0)) continue;
        const pass = resol(e0);
        if (!pass || !dinsMarge(e0, forma) || !pass.every(p => dinsMarge(p.E, forma))) continue;
        let linies = [e0, ...pass.map(p => p.E)];
        const marques = [];
        let ok = true;
        const passa = c => !filtre || filtre(c);
        if (compensades && errades === 2) {
            const parells = [];
            for (const c1 of candidates(r, linies, 1, forma).filter(passa)) {
                const l1 = injecta(linies, c1);
                for (const c2 of candidates(r, l1, c1.j + 1, forma).filter(passa)) {
                    const l2 = injecta(l1, c2);
                    if (valor(l2[l2.length - 1]) === valor(e0)) parells.push([c1, c2, l2]);
                }
            }
            if (!parells.length) continue;
            const [c1, c2, l2] = tria(r, parells);
            marques.push(c1, c2);
            linies = l2;
        } else {
            for (let k = 0; k < errades; k++) {
                const des = marques.length ? marques[marques.length - 1].j + 1 : 1;
                let cs = candidates(r, linies, des, forma).filter(passa);
                if (k === errades - 1) cs = cs.filter(c => injecta(linies, c).length >= mn && injecta(linies, c).length <= mx);
                if (!cs.length) {
                    ok = false;
                    break;
                }
                const c = triaPonderada(r, cs);
                marques.push(c);
                linies = injecta(linies, c);
            }
        }
        if (!ok || linies.length < mn || linies.length > mx) continue;
        if (!compensades && errades === 2 && valor(linies[linies.length - 1]) === valor(e0)) continue;
        const ex = construeix(r, llavor, nivell, e0, linies, marques, compensades);
        if (valida(ex).length === 0) return ex;
    }
    throw new Error(`No s'ha pogut generar cap exemple de prioritat (llavor ${llavor}, nivell ${nivell})`);
}

/** Una variant equivocada de la línia bona per a «Corregeix-la»: un resultat calculat amb una altra operació. */
function retoca(r, abans) {
    const p = pas(abans);
    if (!p || !p.fets.length) return null;
    const k = enter(r, 0, p.fets.length - 1);
    let n = -1;
    // una altra operació amb els mateixos nombres (sense inventar negatius si no n'hi havia)
    const alt = (a, o, b) => {
        const vs = [a + b, a * b, ...(a >= b || a < 0 || b < 0 ? [a - b] : [])].filter(v => v !== 0 && v !== opera(a, o, b) && Math.abs(v) <= 200);
        return vs.length ? tria(r, vs) : a + b + 1;
    };
    // una potència: base·exponent, base + exponent o un exponent de més (amb una sola potència, cal més d'una variant)
    const altW = (a, b) => {
        const vs = [a * b, a + b, a ** (b + 1)].filter(v => v !== a ** b && Math.abs(v) <= 200);
        return vs.length ? tria(r, vs) : a * b;
    };
    const q = pas(abans, { calc: (a, o, b) => (++n === k ? (o === '^' ? altW(a, b) : alt(a, o, b)) : undefined) });
    return q && q.E;
}

function construeix(r, llavor, nivell, e0, linies, marques, compensades) {
    const ex = {
        activitat: 'prioritat',
        llavor,
        nivell,
        alumne: tria(r, NOMS),
        linies: linies.map((E, i) => fitxes(E, i === 0)),
        errades: {},
        correctes: {},
        nota: null,
        solucio: menys(valor(e0)),
        _linies: linies,
    };
    for (const c of marques) {
        const abans = linies[c.j - 1];
        const bona = pas(abans).E;
        const bonaF = fitxes(bona),
            malF = fitxes(linies[c.j]);
        let terme = malF.findIndex((t, i) => t !== '=' && t !== bonaF[i]);
        if (terme < 0) terme = malF.findIndex(t => t !== '=');
        const termes = bonaF.length === malF.length ? malF.map((t, i) => (t !== '=' && t !== bonaF[i] ? i : -1)).filter(i => i >= 0) : [terme];
        const fr = PERQUE[c.id](c.res.dades);
        const perque = barreja(r, [[fr.bona, true], ...barreja(r, fr.dolentes).slice(0, 3).map(t => [t, false])]);
        const vistes = new Set([textLinia(bona), textLinia(linies[c.j])]);
        const dolentes = [];
        for (const [id, rg] of Object.entries(REGLES)) {
            if (id === c.id) continue;
            const res = rg.fes(abans, r);
            if (res && valor(res.E) !== null && valor(res.E) !== valor(abans) && !vistes.has(textLinia(res.E))) {
                vistes.add(textLinia(res.E));
                dolentes.push(textLinia(res.E));
            }
        }
        for (let i = 0; dolentes.length < 2 && i < 40; i++) {
            const t = retoca(r, abans);
            if (t && valor(t) !== null && valor(t) !== valor(abans) && !vistes.has(textLinia(t))) {
                vistes.add(textLinia(t));
                dolentes.push(textLinia(t));
            }
        }
        const opcions = barreja(r, [[textLinia(bona), true], ...barreja(r, dolentes).slice(0, 2).map(t => [t, false])]);
        ex.errades[c.j] = {
            tipus: c.id,
            terme,
            ...(termes.length > 1 ? { termes } : {}),
            expl: REGLES[c.id].expl(c.res.dades),
            bona: textLinia(bona),
            fitxesBona: bonaF,
            perque,
            opcions,
        };
    }
    for (let i = 1; i < linies.length; i++) if (!ex.errades[i]) ex.correctes[i] = perQueBona(pas(linies[i - 1]).fets);
    ex.compensades = !!compensades;
    if (compensades)
        ex.nota = `El resultat $${ex.solucio}$ és correcte, però durant el càlcul s'han comès dues errades que es compensen. Per tant, el càlcul és incorrecte, encara que doni el resultat correcte per casualitat.`;
    return ex;
}

/** Comprova un exemple. Torna la llista de problemes ([] si és bo). */
export function valida(ex) {
    const p = [];
    const ls = ex._linies;
    if (!ls || ls.length < 3) return ['massa poques línies'];
    const err = Object.keys(ex.errades).map(Number);
    if (err.includes(0)) p.push("l'enunciat no pot ser una errada");
    if (ex.linies[0].includes('=')) p.push("l'enunciat no porta «=»");
    for (let i = 0; i < ls.length; i++) if (valor(ls[i]) === null) p.push(`línia ${i}: una divisió no és exacta`);
    for (let i = 1; i < ls.length; i++) {
        if (ex.linies[i][0] !== '=' || ex.linies[i].filter(t => t === '=').length !== 1) p.push(`línia ${i}: ha de començar per un sol «=»`);
        const igual = valor(ls[i - 1]) === valor(ls[i]);
        if (err.includes(i) && igual) p.push(`línia ${i}: marcada com a errada però té el mateix valor que l'anterior`);
        if (!err.includes(i) && !igual) p.push(`línia ${i}: no té el mateix valor que l'anterior però no està marcada`);
        if (!err.includes(i) && !ex.correctes[i]) p.push(`línia ${i}: falta el text de per què és correcta`);
    }
    if (etapa(ls[ls.length - 1]) !== null) p.push("l'última línia no és un sol nombre");
    for (const [j, e] of Object.entries(ex.errades)) {
        if (e.perque.length !== 4 || e.perque.filter(o => o[1]).length !== 1) p.push(`errada ${j}: «Per què?» ha de tenir 4 opcions i una de bona`);
        if (new Set(e.perque.map(o => o[0])).size !== 4) p.push(`errada ${j}: opcions de «Per què?» repetides`);
        if (e.opcions.length !== 3 || e.opcions.filter(o => o[1]).length !== 1) p.push(`errada ${j}: «Corregeix-la» ha de tenir 3 opcions i una de bona`);
        if (new Set(e.opcions.map(o => o[0])).size !== 3) p.push(`errada ${j}: opcions de «Corregeix-la» repetides`);
        if (e.opcions.find(o => o[1])?.[0] !== e.bona) p.push(`errada ${j}: l'opció bona no és la línia bona`);
        if (e.expl.includes(e.bona) || e.expl.includes('$' + e.bona.slice(2) + '$')) p.push(`errada ${j}: l'explicació ja diu com havia de quedar la línia`);
        if (!(e.terme >= 1 && e.terme < ex.linies[j].length)) p.push(`errada ${j}: terme equivocat fora de lloc`);
    }
    const tot = JSON.stringify({ ...ex, _linies: undefined });
    if (/undefined|NaN|Infinity|\[object|null\)/.test(tot)) p.push('hi ha textos amb undefined, NaN o [object');
    return p;
}

export const perPagina = ex => {
    const { _linies, ...resta } = ex;
    return resta;
};
