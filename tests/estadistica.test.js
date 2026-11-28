// tests/estadistica.test.js — el que surt a la llarga (auditoria 2, etapa 3): on cau l'errada (P1), quins tipus surten
// (P2) i d'on surten les opcions falses de «Corregeix-la» (P5). P3 i P4 només s'informen (avís): depenen de les frases
// del David, que encara s'han de revisar a l'editor.
import { ok, informe } from './lib.js';
import * as EQ from '../js/equacions/generador.js';
import * as PR from '../js/prioritat/generador.js';
import { exempleSessio as sessioEq } from '../js/equacions/pagina.js';
import { exempleSessio as sessioPr } from '../js/prioritat/pagina.js';
import { DIAGNOSI_CORREGEIX } from '../js/motor/exemple.js';
import { parametres } from '../js/motor/nivells.js';

const SESSIONS = 40;
// Màxim que una sola línia concentra de les primeres errades. La prioritat de nivell 1 té enunciats de 4–6 línies, i
// les errades només hi caben a la línia 1 o la 2: allà el sostre és més alt (abans de P1 era el 87 % a la línia 1). Amb
// dues errades (nivell 4), la primera ha de deixar lloc a la segona i cau més sovint a la línia 1 (abans: 47 %).
const MAX_LINIA = { 'prioritat 1': 0.6, 'prioritat 4': 0.55 };
// Amb dues errades, la carta de la primera no sempre es pot complir (sobretot si es compensen): més marge.
const MAX_REPETITS = nivell => (nivell >= 4 ? 0.3 : 0.1);
const avis = m => console.log('  avís: ' + m);

for (const [act, sessio, G] of [['equacions', (i, o) => sessioEq(i, { ...o, banc: [] }), EQ], ['prioritat', sessioPr, PR]]) {
    for (let nivell = 1; nivell <= 5; nivell++) {
        const pos = {},
            tipus = {};
        let n = 0,
            repetits = 0;
        const forma = parametres(nivell, false, 0).forma;
        for (let s = 0; s < SESSIONS; s++) {
            const vist = {};
            for (let i = 0; i < 6; i++) {
                const ex = sessio(i, { base: 1009 * s + 7 * nivell, nivell, noerrors: false });
                const js = Object.keys(ex.errades).map(Number).sort((a, b) => a - b);
                n++;
                pos[js[0]] = (pos[js[0]] || 0) + 1;
                const t0 = ex.errades[js[0]].tipus;
                vist[t0] = (vist[t0] || 0) + 1;
                for (const j of js) tipus[ex.errades[j].tipus] = (tipus[ex.errades[j].tipus] || 0) + 1;
            }
            if (Object.values(vist).some(v => v >= 3)) repetits++;
        }
        // P1
        const max = Math.max(...Object.values(pos)) / n,
            lim = MAX_LINIA[`${act} ${nivell}`] || 0.45;
        ok(max <= lim, `P1: ${act}, nivell ${nivell}: una sola línia té el ${Math.round(100 * max)} % de les errades (màxim ${Math.round(100 * lim)} %) ${JSON.stringify(pos)}`);
        if (max > 0.4 && lim <= 0.45) avis(`P1: ${act}, nivell ${nivell}: ${Math.round(100 * max)} % a una sola línia`);
        // P2: cap tipus fora de la llista de la forma; tots els de la llista surten; la primera errada segueix la baralla
        const llista = G.TIPUS_PER_FORMA[forma];
        for (const t of Object.keys(tipus)) ok(llista.includes(t), `P2: ${act}, nivell ${nivell}: ${t} no és a TIPUS_PER_FORMA[${forma}]`);
        for (const t of llista) ok(tipus[t] > 0, `P2: ${act}, nivell ${nivell}: ${t} no surt mai`);
        ok(repetits / SESSIONS <= MAX_REPETITS(nivell), `P2: ${act}, nivell ${nivell}: en el ${Math.round((100 * repetits) / SESSIONS)} % de les sessions la primera errada repeteix tipus 3 vegades`);
    }
}

// P5: a la prioritat, les opcions falses de «Corregeix-la» surten sobretot de concepcions errònies (abans: 87 % retocades)
for (const [act, G, lim] of [['prioritat', PR, 0.55], ['equacions', EQ, 0.35]]) {
    Object.assign(DIAGNOSI_CORREGEIX, { actiu: true, retoca: 0, concepcio: 0 });
    for (let s = 1; s <= 150; s++) G.generaExemple({ llavor: s, nivell: 1 + (s % 2), errades: 1 });
    const d = DIAGNOSI_CORREGEIX,
        q = d.retoca / (d.retoca + d.concepcio);
    DIAGNOSI_CORREGEIX.actiu = false;
    ok(q <= lim, `P5: ${act}: el ${Math.round(100 * q)} % de les opcions falses de «Corregeix-la» són retocades (màxim ${Math.round(100 * lim)} %)`);
}

// P3 i P4 (avisos): pistes a «Per què?»
const xifres = t => (String(t).replace(/-/g, '−').match(/−?\d+(\/\d+)?/g) || []);
for (const [act, G] of [['equacions', EQ], ['prioritat', PR]]) {
    let n = 0,
        nomesXifres = 0,
        mesLlarga = 0,
        regala = 0;
    for (let s = 1; s <= 200; s++) {
        const ex = G.generaExemple({ llavor: s, nivell: 1 + (s % 2), errades: 1 });
        for (const e of Object.values(ex.errades)) {
            n++;
            const bona = e.perque.find(o => o[1])[0],
                falses = e.perque.filter(o => !o[1]).map(o => o[0]);
            if (xifres(bona).length && falses.every(f => !xifres(f).length)) nomesXifres++;
            if (falses.every(f => f.length < bona.length)) mesLlarga++;
            const op = e.opcions.find(o => o[1])[0],
                altres = e.opcions.filter(o => !o[1]).map(o => o[0]).join(' ');
            if (xifres(bona).some(x => xifres(op).includes(x) && !xifres(altres).includes(x) && !xifres(ex.linies.join(' ')).includes(x))) regala++;
        }
    }
    const pc = k => Math.round((100 * k) / n) + ' %';
    if (nomesXifres / n > 0.3) avis(`P3: ${act}: la frase certa és l'única amb xifres en el ${pc(nomesXifres)} (llindar 30 %)`);
    if (mesLlarga / n > 0.45) avis(`P3: ${act}: la frase certa és la més llarga en el ${pc(mesLlarga)} (llindar 45 %)`);
    if (regala / n > 0.1) avis(`P4: ${act}: la frase certa porta un valor que només té l'opció bona de «Corregeix-la» en el ${pc(regala)} (llindar 10 %)`);
}

informe('estadistica');
