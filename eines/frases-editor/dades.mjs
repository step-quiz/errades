import fs from 'node:fs';
const C = JSON.parse(fs.readFileSync('cataleg.json', 'utf8'));
const T = JSON.parse(fs.readFileSync(new URL('../../data/errors.json', import.meta.url), 'utf8'));
const grups = [
    { id: 'G1', tipus: 'quasi', frases: ['F61', 'F65'], que: "Diuen el mateix, amb «el» i sense." },
    { id: 'G2', tipus: 'quasi', frases: ['F03', 'F15'], que: 'Diuen el mateix amb paraules diferents.' },
    { id: 'G3', tipus: 'quasi', frases: ['F34', 'F52'], que: "Totes dues diuen que s'ha equivocat en un càlcul." },
    { id: 'G4', tipus: 'nombre', frases: ['F16', 'F22', 'F41'], que: 'La mateixa frase amb un terme, amb uns quants i amb «els nombres».' },
    { id: 'G5', tipus: 'nombre', frases: ['F25', 'F31'], que: 'La mateixa frase en singular i en plural.' },
    { id: 'G6', tipus: 'nombre', frases: ['F36', 'F40'], que: 'La mateixa frase en singular i en plural.' },
    { id: 'G7', tipus: 'nombre', frases: ['F39', 'F42'], que: 'La mateixa frase amb un nombre i amb «cada nombre».' },
];
for (const g of grups) for (const f of g.frases) if (!C.frases.find(x => x.id === f)) throw new Error('falta ' + f);
const situacions = C.situacions.map(s => ({ ...s, nom: T[s.tipus].nom, mostra: C.mostres[s.id] && { abans: C.mostres[s.id].abans, mal: C.mostres[s.id].mal, bona: C.mostres[s.id].bona, valors: C.mostres[s.id].valors, origen: C.mostres[s.id].origen } }));
for (const s of situacions) if (!s.mostra) throw new Error('sense mostra ' + s.id);
const frases = C.frases.map(f => ({ id: f.id, text: f.text, usos: f.usos }));
fs.writeFileSync('dades.json', JSON.stringify({ situacions, frases, grups }));
console.log(situacions.length, frases.length, frases.filter(f => new Set(f.usos.map(u => u[0])).size > 1).length);
