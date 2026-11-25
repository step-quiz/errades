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
// Fitxers comuns: porten l'avís i no s'han tocat aquí
for (const f of ['js/comu/punts.js', 'js/comu/seguent.js', 'css/seguent.css']) ok(/FITXER COMÚ/.test(llegeix(f)), `${f} no porta l'avís de FITXER COMÚ`);
// El bloc de regles comunes de CLAUDE.md
ok(/<!-- regles-comunes:inici -->[\s\S]*<!-- regles-comunes:fi -->/.test(llegeix('CLAUDE.md')), 'CLAUDE.md no té el bloc de regles comunes');
// Cap petició a tercers a les pàgines
for (const f of ['index.html', 'equacions.html', 'css/tokens.css']) ok(!/https?:\/\/(?!errades\.step-quiz)/.test(llegeix(f).replace(/<!--[\s\S]*?-->/g, '')), `${f} fa peticions a un altre domini`);
informe('docs');
