// tests/docs.test.js — la documentació i el codi diuen el mateix.
import fs from 'node:fs';
import { REGLES } from '../js/equacions/generador.js';
import { ok, informe } from './lib.js';
const llegeix = f => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const tipus = Object.keys(JSON.parse(llegeix('data/errors.json'))).filter(k => !k.startsWith('_'));
const regles = Object.keys(REGLES);
ok(JSON.stringify(tipus.sort()) === JSON.stringify(regles.slice().sort()), `data/errors.json i REGLES no tenen els mateixos tipus (${tipus} / ${regles})`);
const readme = llegeix('README.md'), spec = llegeix('docs/SPEC.md');
for (const r of regles) {
    ok(readme.includes('`' + r + '`'), `README.md no parla de ${r}`);
    ok(spec.includes('`' + r + '`'), `docs/SPEC.md no parla de ${r}`);
}
// El mateix per a la prioritat d'operacions
import { REGLES as REGLES_P } from '../js/prioritat/generador.js';
const tipusP = Object.keys(JSON.parse(llegeix('data/errors-prioritat.json'))).filter(k => !k.startsWith('_'));
ok(JSON.stringify(tipusP.sort()) === JSON.stringify(Object.keys(REGLES_P).sort()), 'data/errors-prioritat.json i REGLES de prioritat no tenen els mateixos tipus');
for (const r of Object.keys(REGLES_P)) {
    ok(readme.includes('`' + r + '`'), `README.md no parla de ${r}`);
    ok(spec.includes('`' + r + '`'), `docs/SPEC.md no parla de ${r}`);
}
// Fitxers comuns: porten l'avís i no s'han tocat aquí
for (const f of ['js/comu/punts.js', 'js/comu/seguent.js', 'css/seguent.css']) ok(/FITXER COMÚ/.test(llegeix(f)), `${f} no porta l'avís de FITXER COMÚ`);
// El bloc de regles comunes de CLAUDE.md
ok(/<!-- regles-comunes:inici -->[\s\S]*<!-- regles-comunes:fi -->/.test(llegeix('CLAUDE.md')), 'CLAUDE.md no té el bloc de regles comunes');
// Cap petició a tercers a les pàgines (els enllaços <a href="https://…"> no són peticions)
for (const f of ['index.html', 'equacions.html', 'prioritat.html', 'banc-errors.html', 'css/tokens.css']) ok(!/(?<!href=")https?:\/\/(?!errades\.step-quiz)/.test(llegeix(f).replace(/<!--[\s\S]*?-->/g, '')), `${f} fa peticions a un altre domini`);
// Els textos dels botons que diuen els documents són els de la llibreta (auditoria C5)
const llibreta = llegeix('js/motor/llibreta.js');
for (const b of ['No hi ha cap errada', 'No hi ha cap més errada', 'Per què?', 'Corregeix-la']) {
    ok(llibreta.includes(b), `js/motor/llibreta.js no té el botó «${b}»`);
    ok(readme.includes('«' + b + '»') || spec.includes('«' + b + '»'), `cap document no esmenta el botó «${b}»`);
}
ok(!/«No n'hi ha cap més»/.test(readme + spec), "README/SPEC encara diuen «No n'hi ha cap més»");
ok(!/Pupil: Kalam/.test(spec), 'SPEC R2 encara diu Kalam per a l\'alumne');
informe('docs');
