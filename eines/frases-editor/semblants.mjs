import fs from 'node:fs';
const C = JSON.parse(fs.readFileSync('cataleg.json', 'utf8'));
const norm = t => t.toLowerCase().replace(/\[[^\]]+\]/g, ' ◆ ').replace(/[$.,:«»{}|()]/g, ' ').split(/\s+/).filter(w => w && !['el', 'la', 'de', 'i', 'a', 'que', 'l', "l'"].includes(w));
const jac = (a, b) => { const A = new Set(a), B = new Set(b); const i = [...A].filter(x => B.has(x)).length; return i / (A.size + B.size - i); };
const parells = [];
for (let i = 0; i < C.frases.length; i++) for (let j = i + 1; j < C.frases.length; j++) {
  const s = jac(norm(C.frases[i].text), norm(C.frases[j].text));
  if (s >= 0.55) parells.push([s.toFixed(2), C.frases[i].id, C.frases[i].text, C.frases[j].id, C.frases[j].text]);
}
parells.sort((a, b) => b[0] - a[0]).forEach(p => console.log(p.join(' | ')));
