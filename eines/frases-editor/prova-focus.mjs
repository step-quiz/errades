// Simula un db que, com el real, torna a avisar (onSnapshot) cada cop que es desa: el cursor no s'ha de perdre.
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../package.json', import.meta.url));
const { chromium } = require('playwright-core');
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const pg = await b.newPage({ viewport: { width: 1200, height: 900 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.addInitScript(() => {
  const dades = {}, oients = {};
  const avisa = name => { const docs = Object.entries(dades[name] || {}).map(([id, v]) => ({ id, data: () => v })); (oients[name] || []).forEach(f => f({ docs })); };
  const col = name => ({
    doc: id => ({ set: async d => { (dades[name] ||= {})[id] = JSON.parse(JSON.stringify(d)); setTimeout(() => avisa(name), 20); }, get: async () => ({ exists: false }) }),
    onSnapshot: ok => { (oients[name] ||= []).push(ok); setTimeout(() => avisa(name), 10); return () => {}; },
  });
  window.claude = { use: async k => (k === 'db' ? { collection: col, doc: p => ({ set: async () => {}, get: async () => ({ exists: false }), onSnapshot: () => () => {} }) } : null) };
});
await pg.goto(new URL('./index.html', import.meta.url).href);
await pg.waitForTimeout(400);
for (const sel of ['#s-ST1 .fr.bona textarea', '#c-CO', '#s-DSUMA .fr[data-rol=dolenta][data-k="1"] textarea']) {
  await pg.click(sel);
  await pg.keyboard.press('End');
  await pg.keyboard.type(' prova');
  await pg.waitForTimeout(1500); // desat (800 ms) + avís del db
  await pg.keyboard.type(' i més');
  const r = await pg.evaluate(s => { const el = document.querySelector(s); return { focus: document.activeElement === el, fi: el.value.endsWith(' prova i més'), cursor: el.selectionStart === el.value.length }; }, sel);
  console.log(sel, JSON.stringify(r));
}
// un canvi d'estructura (afegir un distractor) tampoc no ha de fer perdre el cursor d'un altre camp
await pg.click('#c-DIST'); await pg.keyboard.type('abc');
await pg.waitForTimeout(1500); await pg.keyboard.type('def');
console.log('#c-DIST', await pg.evaluate(() => document.activeElement.id + ' ' + document.activeElement.value));
console.log('errors:', errs);
await b.close();
