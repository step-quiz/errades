// Catàleg de les frases de «Per què és una errada?» (equacions), amb les situacions on s'usen.
// Es comprova contra el que el generador escriu de debò (molts exemples) i es desa dades.json.
import fs from 'node:fs';
import { generaExemple, perPagina } from '../../js/equacions/generador.js';
const ARREL = new URL('../../', import.meta.url).pathname;
const TIPUS = JSON.parse(fs.readFileSync(ARREL + 'data/errors.json', 'utf8'));
const BANC = JSON.parse(fs.readFileSync(ARREL + 'data/banc.json', 'utf8')).exemples;

// [nom]: un valor que canvia amb l'exemple. Les situacions diuen què vol dir cada [nom].
const S = [];
const sit = (id, tipus, titol, quan, marcadors, bona, dolentes, nota = '') => S.push({ id, tipus, titol, quan, marcadors, bona, dolentes, nota });
// dolentes: text o [text, condició]
sit('DIST', 'DISTRIBUTIVA', 'Propietat distributiva', 'El nombre de fora del parèntesi només multiplica la x.',
    { c: 'el nombre de fora del parèntesi', b: 'el nombre de dins del parèntesi', 'la x': '«la $x$», o «$3x$» si a dins hi ha un coeficient' },
    'Ha multiplicat el $[c]$ per [la x], però no pel $[b]$.',
    ['Ha multiplicat el $[c]$ pel $[b]$, però no per [la x].', "El $[c]$ s'havia de sumar a cada terme del parèntesi, i no multiplicar-hi.", "Ha canviat el signe del $[b]$, i no l'havia de canviar."]);
sit('DSIG1', 'DIST_SIGNE', 'Signe davant d\'un parèntesi: −(x + b)', 'Davant del parèntesi només hi ha un signe −, i el nombre de dins no canvia de signe.',
    { b: 'el nombre de dins del parèntesi', 'de la x': '«de la $x$», o «del $3x$» si a dins hi ha un coeficient' },
    "El signe $−$ de davant del parèntesi havia de canviar el signe del $[b]$, i no l'ha canviat.",
    ['El signe $−$ de davant del parèntesi no ha canviat el signe [de la x].', 'El signe $−$ de davant del parèntesi només havia de canviar el signe [de la x].', "Havia de canviar el signe de tots els termes de l'equació."]);
sit('DSIG2', 'DIST_SIGNE', "Signe davant d'un parèntesi: −2·(x + b)", 'Un nombre negatiu multiplica el parèntesi, i el signe del segon terme surt malament.',
    { c: 'el nombre (negatiu) de fora del parèntesi', b: 'el nombre de dins del parèntesi', 'la x': '«la $x$», o «$3x$» si a dins hi ha un coeficient' },
    "Ha multiplicat el $[c]$ pel $[b]$ i s'ha equivocat en el signe del resultat.",
    ["Ha multiplicat el $[c]$ per [la x] i s'ha equivocat en el signe.", 'No havia de multiplicar el $[b]$: només es multiplica [la x].', "Havia de canviar el signe de tots els termes de l'equació."]);
sit('DSUMA', 'DIST_SUMA', 'Suma en lloc de multiplicar', 'El nombre de fora se suma al coeficient de dins: −2·(3x + 6) → −5x − 12.',
    { c: 'el nombre de fora', 'c sense signe': 'el nombre de fora, sense signe', m: 'el coeficient de la x de dins', b: 'el nombre de dins', 'la x': '«$3x$» (el terme en x de dins)' },
    "Ha sumat el $[c sense signe]$ i el $[m]$ de $[m]x$, i els havia de multiplicar.",
    ['Ha multiplicat el $[c]$ per [la x], però no pel $[b]$.', "S'ha equivocat en el signe del terme en $x$.", "S'ha equivocat multiplicant el $[c]$ pel $[b]$.", 'Havia de sumar el $[c]$ a cada terme del parèntesi.']);
sit('ST1', 'SIGNE_TRANSPOSAR', 'Signe en passar un terme (un terme)', 'Un terme canvia de membre sense canviar de signe.',
    { terme: 'el terme que ha passat sense canviar de signe (amb el seu signe)', 'altre terme': 'un altre terme que ha passat bé' },
    "Ha passat el $[terme]$ a l'altre membre sense canviar-li el signe.",
    [["Ha canviat el signe del $[altre terme]$ en passar-lo a l'altre membre, i no l'havia de canviar.", "només si en aquesta línia ha passat un altre terme"],
     ["Ha passat el $[terme]$ a l'altre membre, però l'havia de deixar on era.", "només si no n'ha passat cap altre"],
     "El $[terme]$ havia de passar a l'altre membre dividint.", "Havia de passar tots els termes, també els nombres, al membre de l'esquerra.", "Havia de sumar els termes de cada membre abans de passar-los a l'altre."]);
sit('ST2', 'SIGNE_TRANSPOSAR', 'Signe en passar termes (tots els que passen)', 'Tots els termes que canvien de membre es queden amb el seu signe.',
    { 'els termes': '«el $+3$ i el $+2x$»' },
    "Ha passat [els termes] a l'altre membre sense canviar-los el signe.",
    ['Ha canviat el signe dels termes que es quedaven al seu membre.', "Els termes havien de passar a l'altre membre dividint.", "Havia de passar tots els termes, també els nombres, al membre de l'esquerra.", "Havia de sumar els termes de cada membre abans de passar-los a l'altre."]);
sit('SC1', 'SIGNE_COPIAT', 'Signe copiat malament (un terme)', "Un terme que en aquest pas només s'havia de copiar surt amb el signe canviat.",
    { terme: 'el terme copiat, tal com era a la línia de sobre' },
    'Ha copiat el $[terme]$ de la línia de sobre amb el signe canviat.',
    ["Ha passat el $[terme]$ a l'altre membre sense canviar-li el signe.", "El $[terme]$ havia de canviar de signe, i l'ha deixat igual.",
     ['El $[terme]$ també quedava multiplicat pel nombre de davant del parèntesi.', 'només si el pas és treure parèntesis'],
     ['Ha sumat el $[terme]$ amb un terme que no era semblant.', 'només si el pas és agrupar termes'],
     ["El $[terme]$ havia de passar a l'altre membre.", 'només si el pas és passar termes'],
     "S'ha equivocat sumant dos nombres d'aquesta línia."]);
sit('SC2', 'SIGNE_COPIAT', 'Signe copiat malament (dos termes)', "Dos termes que només s'havien de copiar surten amb el signe canviat (el teu B15).",
    { 'els termes': '«el $−8$ i el $−36$»', 'Els termes': 'el mateix, amb majúscula: «El $−8$ i el $−36$»' },
    'Ha copiat [els termes] de la línia de sobre amb el signe canviat.',
    ["Ha passat [els termes] a l'altre membre sense canviar-los el signe.", "[Els termes] havien de canviar de signe, i els ha deixat igual.", "S'ha equivocat sumant dos nombres d'aquesta línia."]);
sit('TNS1', 'TERMES_NO_SEMBLANTS', 'Termes no semblants (en passar)', 'Suma un terme en x i un nombre: 2x + 6 → 8x.',
    { x: 'el terme en x («2x»)', n: 'el nombre («6»)', terme: 'el nombre amb el seu signe («+6»)', suma: 'els dos coeficients sumats («2 + 6»)', resultat: 'el que fa la suma («8»)' },
    "Ha sumat $[x]$ i $[n]$ com si fossin termes semblants, però un té $x$ i l'altre no.",
    ["Ha passat el $[terme]$ a l'altre membre sense canviar-li el signe.", "S'ha equivocat en el càlcul: $[suma]$ no fa $[resultat]$.", 'Havia de multiplicar $[x]$ per $[n]$.']);
sit('TNS2', 'TERMES_NO_SEMBLANTS', 'Termes no semblants (tres termes, un nombre)', 'En agrupar, ho suma tot com si fossin x: 2x + 3 + 4x → 9x (el teu B16).',
    { terme: 'el nombre, amb el seu signe («+3»)' },
    'Ha sumat el $[terme]$ amb els termes en $x$, però el $[terme]$ no té $x$.',
    ["Ha passat el $[terme]$ a l'altre membre sense canviar-li el signe.", 'Havia de multiplicar els termes en $x$, i no sumar-los.', "Els termes en $x$ no es podien sumar perquè no són l'un al costat de l'altre.", "El $[terme]$ s'havia de multiplicar per la $x$."]);
sit('TNS3', 'TERMES_NO_SEMBLANTS', 'Termes no semblants (tres termes, més d\'un nombre)', 'Com l\'anterior, però al membre hi ha més d\'un nombre (surt poques vegades).',
    {},
    'Ha sumat els nombres amb els termes en $x$, però els nombres no tenen $x$.',
    ["Ha passat els nombres a l'altre membre sense canviar-los el signe.", 'Havia de multiplicar els termes en $x$, i no sumar-los.', "Els termes en $x$ no es podien sumar perquè no són l'un al costat de l'altre.", "Cada nombre s'havia de multiplicar per la $x$."]);
sit('CU', 'COEFICIENT_U', 'La x sola no es compta', '3x + x + 6x → 9x (la teva errada real).',
    { 'x sola': '«x», o «−x»', '1x': '«1x», o «−1x»', suma: 'la suma dels termes en x («3x + x + 6x»)' },
    'No ha comptat la $[x sola]$: la $[x sola]$ vol dir $[1x]$.',
    ["Ha calculat $[suma]$ i s'ha equivocat en el signe del resultat.", 'Ha sumat termes que no són semblants.',
     ['Ha restat la $x$ en lloc de sumar-la.', 'només si la x sola és positiva'], ['Ha sumat la $x$ en lloc de restar-la.', 'només si és −x'],
     'Ha comptat la $[x sola]$ dues vegades.']);
const CAL = { suma: 'la suma que ha calculat malament («−3 + 15»)', a: 'el primer terme, amb el signe («−3»)', b: 'el segon terme, amb el signe («+15»)', 'altre càlcul': 'una altra suma de la mateixa línia (si n\'hi ha)' };
const CS = "Ha calculat $[suma]$ i s'ha equivocat en el signe del resultat.",
    CSU = 'Els termes $[a]$ i $[b]$ tenen signes diferents, però els ha sumat com si tinguessin el mateix signe.',
    CRE = 'Els termes $[a]$ i $[b]$ tenen el mateix signe, però els ha restat com si tinguessin signes diferents.';
const CALTRES = ['Ha sumat termes que no són semblants.', 'En lloc de sumar, havia de multiplicar: $[suma]$ és un producte.', ["S'ha equivocat en el càlcul de $[altre càlcul]$.", 'una per cada altra suma de la línia']];
sit('CAL1', 'CALCUL', 'Error de càlcul: el signe del resultat', '−3 + 15 → −12.', CAL, CS, [CSU, CRE, ...CALTRES]);
sit('CAL2', 'CALCUL', 'Error de càlcul: suma els valors', 'Signes diferents i els suma: −3 + 15 → −18.', CAL, CSU, [CS, CRE, ...CALTRES]);
sit('CAL3', 'CALCUL', 'Error de càlcul: resta els valors', 'El mateix signe i els resta: −3 − 15 → −12.', CAL, CRE, [CS, CSU, ...CALTRES]);
const OI = { operacio: "l'operació que ha fet («12 − 3»)", B: 'el nombre de la dreta («12»)', A: 'el coeficient de la x («3»)', 'resultat canviat de signe': 'el resultat que ha obtingut, amb el signe canviat', 'A i B enganxats': 'els dos nombres escrits l\'un darrere l\'altre («312»)' };
const OIB = "Ha decidit fer $[operacio]$, però hauria d'haver fet ${[B]|[A]}$.",
    OIR = 'Havia de fer $[operacio]$, però el resultat és $[resultat canviat de signe]$.',
    OIE = 'El resultat és $[A i B enganxats]$.';
sit('OI1', 'OPERACIO_INVERSA', 'Operació inversa: resta', '3x = 12 → x = 9 (B − A) o x = −9 (A − B).', OI, OIB, ['Ha decidit fer una resta, però havia de fer una suma.', OIR, OIE]);
sit('OI3', 'OPERACIO_INVERSA', 'Operació inversa: multiplica', '3x = 12 → x = 36.', OI, OIB, ['Ha decidit fer un producte, però havia de fer una suma.', OIR, OIE]);
sit('OI4', 'OPERACIO_INVERSA', 'Operació inversa: suma', '3x = 12 → x = 15.', OI, OIB, ['Ha decidit fer una suma, però havia de fer una resta.', OIR, OIE]);
sit('CO', 'COEFICIENT_OBLIDAT', 'Coeficient oblidat', '3x = 12 → x = 12.', { A: 'el coeficient de la x', B: 'el nombre de la dreta' },
    'Ha tret el $[A]$ de davant de la $x$ sense dividir-hi.', ['Ha dividit al revés: ${[A]|[B]}$.', 'Havia de restar el $[A]$ als dos membres.', 'Ha multiplicat el $[B]$ pel $[A]$.']);
sit('DS', 'DIVISIO_SIGNE', 'Signe en dividir', '−3x = 12 → x = 4.', { A: 'el coeficient de la x (negatiu)', 'A sense signe': 'el coeficient, sense signe', B: 'el nombre de la dreta' },
    'Ha dividit entre $[A sense signe]$, però havia de dividir entre $[A]$.', ['Havia de multiplicar per $[A]$, i no dividir.', 'Havia de restar $[A]$ als dos membres.', 'Havia de dividir al revés: ${[A]|[B]}$.']);
sit('QI', 'QUOCIENT_INVERTIT', 'Divisió al revés', '3x = 12 → x = 3/12.', { A: 'el coeficient de la x', B: 'el nombre de la dreta', 'B menys A': '«12 − 3»', 'B per A': '«12 · 3»' },
    'Ha fet ${[A]|[B]}$, però havia de fer ${[B]|[A]}$.', ['Havia de fer $[B menys A]$.', 'Havia de fer $[B per A]$.', "La divisió està ben plantejada, però s'havia de simplificar abans."]);

// ---- Frases úniques (una sola font per a cada text) ----
const frases = [];
const idDe = new Map();
function frase(text) {
    if (!idDe.has(text)) {
        const id = 'F' + String(frases.length + 1).padStart(2, '0');
        idDe.set(text, id);
        frases.push({ id, text, usos: [] });
    }
    return idDe.get(text);
}
for (const s of S) {
    s.bona = frase(s.bona);
    frases.find(f => f.id === s.bona).usos.push([s.id, 'bona']);
    s.dolentes = s.dolentes.map(d => {
        const [t, cond] = Array.isArray(d) ? d : [d, ''];
        const id = frase(t);
        frases.find(f => f.id === id).usos.push([s.id, 'dolenta']);
        return cond ? { id, cond } : { id };
    });
}

// ---- Comprovació contra el generador: cada frase que surt ha de ser d'una plantilla de la seva situació ----
const marcadors = t => [...t.matchAll(/\[([^\]]+)\]/g)].map(m => m[1]);
function regex(t) {
    const noms = [];
    let src = '';
    let k = 0;
    for (const part of t.split(/(\[[^\]]+\])/)) {
        if (/^\[[^\]]+\]$/.test(part)) {
            const n = part.slice(1, -1);
            const i = noms.indexOf(n);
            if (i >= 0) src += `\\k<g${i}>`;
            else {
                noms.push(n);
                // dins d'una fórmula ($…$), el valor no pot passar a la fórmula següent
                src += src.endsWith('\\$') || src.endsWith('\\{') || src.endsWith('|') ? `(?<g${noms.length - 1}>[^$|{}]+?)` : `(?<g${noms.length - 1}>.+?)`;
            }
        } else src += part.replace(/[.*+?^${}()|\\]/g, '\\$&');
        k++;
    }
    return { re: new RegExp('^' + src + '$'), noms };
}
const textDe = id => frases.find(f => f.id === id).text;
const plantilles = s => [s.bona, ...s.dolentes.map(d => d.id)].map(id => ({ id, ...regex(textDe(id)) }));
// la situació: la de la frase bona; si n'hi ha més d'una, aquella on totes les frases tenen plantilla
const situacioDe = (tipus, perque) => {
    const bona = perque.find(p => p[1])[0];
    const cs = S.filter(s => s.tipus === tipus && regex(textDe(s.bona)).re.test(bona));
    return cs.find(s => perque.every(([t]) => plantilles(s).some(q => q.re.test(t)))) || null;
};
const mostres = {};
const fallades = [];
const vistes = new Set();
const antigues = new Set(); // exemples del banc amb frases d'abans (B08: l'error de càlcul antic)
const prova = (ex, origen) => {
    for (const [j, e] of Object.entries(ex.errades)) {
        const s = situacioDe(e.tipus, e.perque);
        if (!s) {
            const bona = e.perque.find(p => p[1])[0];
            if (origen === 'banc') antigues.add(`${ex.banc}: ${bona}`);
            else fallades.push(`sense situació: ${e.tipus}: ${e.perque.map(p => p[0]).join(' / ')}`);
            continue;
        }
        const ps = plantilles(s);
        const valors = {};
        for (const [t] of e.perque) {
            const p = ps.find(q => q.re.test(t));
            if (!p) {
                fallades.push(`${s.id}: cap plantilla per a «${t}»`);
                continue;
            }
            vistes.add(s.id + ':' + p.id);
            const m = t.match(p.re);
            p.noms.forEach((n, i) => (valors[n] = m.groups['g' + i]));
        }
        const prev = mostres[s.id];
        const nouBo = !prev || (origen === 'banc' && prev.origen !== 'banc') || Object.keys(valors).length > Object.keys(prev.valors).length;
        if (nouBo) mostres[s.id] = { origen, abans: ex.linies[j - 1].join(' '), mal: ex.linies[j].join(' '), bona: e.bona, valors, perque: e.perque };
    }
};
for (const ex of BANC) prova(ex, 'banc');
for (const nivell of [1, 2]) for (const errades of [1, 2]) for (let s = 1; s <= 1500; s++) {
    try { prova(perPagina(generaExemple({ llavor: s, nivell, errades }, TIPUS)), 'generador'); } catch (e) { /* */ }
}
console.log('fallades:', fallades.length, [...new Set(fallades)].slice(0, 15));
console.log('banc amb frases antigues:', [...antigues]);
for (const s of S) {
    const falten = [s.bona, ...s.dolentes.map(d => d.id)].filter(id => !vistes.has(s.id + ':' + id));
    if (!mostres[s.id]) console.log('SENSE MOSTRA', s.id);
    else if (falten.length) console.log('no vistes a', s.id, falten.map(textDe));
}
// valors escrits a mà per a les situacions rares (o per als marcadors que no es poden deduir)
const AMA = {
    DSIG1: { abans: '5x − (x + 3) = 9', mal: '5x − x + 3 = 9', bona: '5x − x − 3 = 9', valors: { b: '3', 'de la x': 'de la $x$' } },
    TNS3: { abans: '2x + 3 + 4x − 1 = 18', mal: '8x = 18', bona: '6x + 2 = 18', valors: {} },
    OI3: { abans: '3x = 12', mal: 'x = 36', bona: 'x = {12|3}', valors: { operacio: '12 · 3', B: '12', A: '3', 'resultat canviat de signe': '−36', 'A i B enganxats': '312' } },
    OI4: { abans: '3x = 12', mal: 'x = 15', bona: 'x = {12|3}', valors: { operacio: '12 + 3', B: '12', A: '3', 'resultat canviat de signe': '−15', 'A i B enganxats': '312' } },
};
for (const [id, m] of Object.entries(AMA)) if (!mostres[id]) mostres[id] = { origen: 'a mà', perque: [], ...m };
for (const s of S) {
    const m = mostres[s.id];
    if (!m) continue;
    const v = m.valors;
    if ('B per A' in s.marcadors && v.A && v.B) v['B per A'] = `${v.B} · ${v.A.startsWith('−') ? '(' + v.A + ')' : v.A}`;
    if ('B menys A' in s.marcadors && v.A && v.B) v['B menys A'] = `${v.B} − ${v.A.startsWith('−') ? '(' + v.A + ')' : v.A}`;
}
// valors que falten per a la vista prèvia
for (const s of S) {
    const v = mostres[s.id]?.valors || {};
    const falta = Object.keys(s.marcadors).filter(n => !(n in v));
    if (falta.length) console.log('falten valors', s.id, falta);
}
fs.writeFileSync(new URL('./cataleg.json', import.meta.url), JSON.stringify({ situacions: S, frases, mostres }, null, 1));
console.log('frases:', frases.length, 'compartides:', frases.filter(f => new Set(f.usos.map(u => u[0])).size > 1).length);
