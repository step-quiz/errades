// Refà les frases de «Per què?» dels exemples de data/banc.json amb les frases de l'editor
// (js/equacions/frases-dades.js). Les línies, les explicacions i la resta no canvien.
//
//   node eines/frases-editor/banc.mjs
//
// Per a cada errada, busca les dades de la regla tornant a aplicar-la a la línia de sobre
// fins que dona la línia de l'alumne; si no les troba, l'errada es queda amb les frases d'abans.
import fs from 'node:fs';
import { REGLES, Q, T, text, aplica, frasesErrada } from '../../js/equacions/generador.js';
import { creaAtzar, barreja } from '../../js/motor/atzar.js';
import { DISTRACTORS_PERQUE, opcionsPerque } from '../../js/motor/exemple.js';
const FITXER = new URL('../../data/banc.json', import.meta.url);
const banc = JSON.parse(fs.readFileSync(FITXER, 'utf8'));
const { X, N, P, I, D, linia } = T;
const F = (num, den) => ({ k: 'f', num, den });
const nombre = s => Number(s.replace('−', '-'));
function terme(f, primer) {
    let s = f.trim(),
        sg = 1;
    if (/^[+−] /.test(s)) {
        sg = s[0] === '−' ? -1 : 1;
        s = s.slice(2);
    } else if (!primer && /^[+−]/.test(s)) throw new Error('fitxa estranya: ' + f);
    if (s[0] === '−') {
        sg = -sg;
        s = s.slice(1);
    }
    let m;
    if ((m = /^(?:(\d+)·)?\(((\d*)x) ([+−]) (\d+)\)$/.exec(s))) return P(sg * (m[1] ? Number(m[1]) : 1), (m[4] === '−' ? -1 : 1) * Number(m[5]), m[3] ? Number(m[3]) : 1);
    if ((m = /^\{(\d+)\|x\}$/.exec(s))) return I(sg * Number(m[1]));
    if ((m = /^\{(−?\d+)\|(−?\d+)\}$/.exec(s))) return sg < 0 ? N(new Q(-nombre(m[1]), nombre(m[2]))) : F(nombre(m[1]), nombre(m[2]));
    if ((m = /^(\d*)x$/.exec(s))) return X(sg * (m[1] ? Number(m[1]) : 1));
    if ((m = /^(\d+)$/.exec(s))) return N(sg * Number(m[1]));
    throw new Error('no entenc la fitxa ' + f);
}
function liniaDe(fs) {
    const q = fs.indexOf('=');
    return linia(fs.slice(0, q).map((f, i) => terme(f, i === 0)), fs.slice(q + 1).map((f, i) => terme(f, i === 0)));
}
const ops = r => (Array.isArray(r.op) ? r.op : [r.op]);
let fets = 0,
    no = [];
for (const ex of banc.exemples) {
    const r = creaAtzar(((ex.llavor || 1) ^ 0x2545f491) >>> 0);
    for (const [j, e] of Object.entries(ex.errades)) {
        const abans = liniaDe(ex.linies[j - 1]);
        const objectiu = ex.linies[j].join(' ');
        if (text(abans) !== ex.linies[j - 1].join(' ')) throw new Error(`${ex.banc}: no sé llegir la línia ${j - 1}`);
        const regla = REGLES[e.tipus];
        let trobat = null;
        for (const op of ops(regla)) {
            if (!aplica(op, abans)) continue;
            for (let s = 1; s < 3000 && !trobat; s++) {
                const res = regla.fes(abans, creaAtzar(s), op);
                if (res && text(res.linia) === objectiu) trobat = { op, dades: res.dades };
            }
            if (trobat) break;
        }
        if (!trobat) {
            // les frases d'abans: es queda la bona i DISTRACTORS_PERQUE distractors a l'atzar
            no.push(`${ex.banc} línia ${j} (${e.tipus})`);
            const bona = e.perque.find(o => o[1]),
                dol = barreja(r, e.perque.filter(o => !o[1]));
            const tria = [bona, ...dol.slice(0, DISTRACTORS_PERQUE)];
            e.perque = e.perque.filter(o => tria.includes(o));
            continue;
        }
        const fr = frasesErrada(e.tipus, trobat.dades, { op: trobat.op, abans, malF: ex.linies[j], bonaF: e.fitxesBona, terme: e.terme });
        e.perque = opcionsPerque(r, fr.bona, fr.dolentes);
        fets++;
    }
}
fs.writeFileSync(FITXER, JSON.stringify(banc, null, 1) + '\n');
console.log(`frases refetes: ${fets}; sense trobar les dades: ${no.length}`, no);
