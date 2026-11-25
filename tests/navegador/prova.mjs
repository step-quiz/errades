// tests/navegador/prova.mjs — prova de fum al navegador (local; no és a la CI).
//
// Ús:  npm install --no-save playwright   (només la primera vegada; o fes servir un Chrome
//      instal·lat: CHROME=/usr/bin/google-chrome node tests/navegador/prova.mjs)
//      node tests/navegador/prova.mjs
//
// Serveix la carpeta amb un servidor propi i, a 1366×768 (ratolí) i a 360×740 (tàctil):
//   · l'índex genera l'enllaç;
//   · a equacions.html, un exemple sencer tocant línies (una de bona i després la dolenta),
//     «Per què?», «Corregeix-la» i «Següent»; un altre amb el teclat;
//   · la pantalla final amb la nota;
//   · cap error de JavaScript, cap petició fora del servidor, cap desplaçament lateral.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let chromium;
try {
    ({ chromium } = await import('playwright'));
} catch (e) {
    try {
        ({ chromium } = await import('playwright-core'));
    } catch (e2) {
        console.log('Cal Playwright: npm install --no-save playwright');
        process.exit(2);
    }
}

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const TIPUS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2' };
const servidor = http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const f = path.join(ARREL, u === '/' ? 'index.html' : u);
    if (!f.startsWith(ARREL) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
        res.writeHead(404);
        return res.end();
    }
    res.writeHead(200, { 'Content-Type': TIPUS[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
});
await new Promise(r => servidor.listen(0, r));
const BASE = `http://127.0.0.1:${servidor.address().port}/`;

let errors = 0,
    oks = 0;
const ok = (c, m) => (c ? oks++ : (errors++, console.log('  ✗ ' + m)));
const navegador = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });

for (const [nom, mida, tactil] of [['ordinador', { width: 1366, height: 768 }, false], ['mòbil', { width: 360, height: 740 }, true]]) {
    console.log('· ' + nom);
    const ctx = await navegador.newContext({ viewport: mida, hasTouch: tactil, isMobile: tactil });
    const pg = await ctx.newPage();
    const fallades = [];
    pg.on('pageerror', e => fallades.push(String(e)));
    pg.on('request', r => {
        if (!r.url().startsWith(BASE)) fallades.push('petició externa: ' + r.url());
    });
    const clica = async sel => (tactil ? pg.tap(sel) : pg.click(sel));
    const lateral = async () => pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

    // Índex
    await pg.goto(BASE + 'index.html');
    await pg.check('input[name=nivell][value="2"]');
    ok((await pg.inputValue('#eq-enllac')).endsWith('equacions.html?nivell=2'), 'índex: enllaç amb nivell 2');
    ok(await lateral(), 'índex: desplaçament lateral');

    // Activitat: 2 exemples, llavor fixa
    await pg.goto(BASE + 'equacions.html?totaloperations=2&llavor=11');
    await pg.waitForSelector('#llibreta .ln');
    const errada = await pg.evaluate(async () => {
        const g = await import('./js/equacions/generador.js');
        const t = await (await fetch('data/errors.json')).json();
        return Object.keys(g.generaExemple({ llavor: 11, nivell: 1, errades: 1 }, t).errades).map(Number)[0];
    });
    const bona = errada === 1 ? 2 : 1;
    ok((await pg.locator('#llibreta [data-a=comprova]').count()) === 0, 'al principi no hi ha cap botó «Comprova»');
    await clica(`#llibreta [data-l="${bona}"]`);
    ok((await pg.locator(`#llibreta .fila[data-i="${bona}"] .cv [data-a=comprova]`).count()) === 1, '«Comprova» surt a l\'esquerra de la línia triada');
    await clica('#llibreta [data-a=comprova]');
    ok(/^En aquesta línia no s'ha comès cap errada/.test(await pg.textContent('#llibreta .msg')), 'línia bona: explica per què és correcta');
    ok(await pg.locator('#llibreta .ln.enunciat').evaluate(e => getComputedStyle(e).cursor) === 'not-allowed', 'la línia 0 té el cursor de prohibit');
    ok((await pg.textContent('#llibreta .ln.enunciat .n')).trim() === '0', 'la primera línia és la 0');
    ok((await pg.locator('#llibreta .mk.c').count()) === 1, 'línia bona: ✓ de llapis');
    await clica(`#llibreta [data-l="${errada}"]`);
    await clica('#llibreta [data-a=comprova]');
    ok(/Sí! L'errada és aquí/.test(await pg.textContent('#llibreta .msg')), 'línia dolenta: encert');
    await pg.waitForTimeout(700); // el desplaçament suau
    const vista = await pg.evaluate(e => {
        const r = s => document.querySelector(s).getBoundingClientRect();
        const a = r(`#llibreta .fila[data-i="${e - 1}"]`), b = r(`#llibreta .fila[data-i="${e}"]`), f = r('#llibreta .fase');
        const atenuades = [...document.querySelectorAll('#llibreta .fila')].filter(x => x.classList.contains('atenua')).map(x => +x.dataset.i);
        return { dins: a.top >= 0 && b.bottom <= innerHeight && f.top >= 0 && f.bottom <= innerHeight, atenuades, n: document.querySelectorAll('#llibreta .fila').length, opcions: document.querySelectorAll('#llibreta .fase .b').length };
    }, errada);
    ok(vista.dins, 'la línia anterior, la línia equivocada i les opcions es veuen a la pantalla');
    ok(vista.opcions === 4, '«Per què?» amb 4 opcions');
    ok(vista.atenuades.length === vista.n - 2 && !vista.atenuades.includes(errada) && !vista.atenuades.includes(errada - 1), 'les altres línies queden esvaïdes');
    await clica('#llibreta [data-pq="0"]');
    await clica('#llibreta [data-co="0"]');
    ok(await pg.isVisible('.franja-final'), 'franja «Següent» a la vista');
    ok(/punts/.test(await pg.textContent('.franja-final')), 'la franja diu els punts');
    ok((await pg.locator('#llibreta .corr').count()) === 1, 'la correcció del professor és a la llibreta');
    const ratlles = await pg.evaluate(() => {
        const ln = document.querySelector('#llibreta .ln.tat'), c = ln.querySelector('.corr');
        const tx = el => el.textContent.replace(/\s+/g, '');
        return ['ma', 'mb'].map(m => ({ ratllat: ln.querySelector(`.ex:not(.corr) > .${m}`).classList.contains('ratlla'), igual: tx(ln.querySelector(`.ex:not(.corr) > .${m}`)) === tx(c.querySelector(`.${m}`)) }));
    });
    ok(ratlles.every(r => r.ratllat !== r.igual) && ratlles.some(r => r.ratllat), 'només es ratlla el membre que està malament');
    ok(await lateral(), 'exemple 1: desplaçament lateral');
    await clica('#btn-next');

    // Segon exemple, amb el teclat (Enter també prem «Següent»)
    await pg.waitForSelector('#llibreta [data-l="1"]');
    const errada2 = await pg.evaluate(async () => {
        const g = await import('./js/equacions/generador.js');
        const t = await (await fetch('data/errors.json')).json();
        return Object.keys(g.generaExemple({ llavor: (11 + 7919) >>> 0, nivell: 1, errades: 1 }, t).errades).map(Number)[0];
    });
    await pg.focus('#llibreta');
    await pg.keyboard.press(String(errada2));
    await pg.keyboard.press('Enter');
    ok(/Sí! L'errada és aquí/.test(await pg.textContent('#llibreta .msg')), 'teclat: encert');
    await pg.keyboard.press('Enter'); // «Per què?»: primer botó amb focus
    await pg.keyboard.press('Enter'); // «Corregeix-la»: primer botó amb focus
    ok(await pg.isVisible('.franja-final'), 'teclat: franja a la vista');
    await pg.keyboard.press('Enter'); // «Veure resultats»
    await pg.waitForSelector('#final:not([hidden])');
    ok(/Has acabat/.test(await pg.textContent('#final')) && (await pg.locator('#final .resum li').count()) === 2, 'pantalla final amb 2 exemples');
    ok(/Nota/.test(await pg.textContent('#final .nota')), 'pantalla final amb la nota');
    if (process.env.CAPTURES) await pg.screenshot({ path: path.join(process.env.CAPTURES, `final-${mida.width}.png`) });
    await clica('#torna');
    await pg.waitForSelector('#llibreta .ln');
    ok(await pg.isHidden('#final'), '«Torna a començar» torna a la llibreta');
    if (process.env.CAPTURES) {
        await pg.goto(BASE + 'equacions.html?nivell=2&llavor=5');
        await pg.waitForSelector('#llibreta .ln');
        await pg.screenshot({ path: path.join(process.env.CAPTURES, `nivell2-${mida.width}.png`), fullPage: true });
    }
    ok(fallades.length === 0, 'errors o peticions externes: ' + fallades.join(' | '));
    await ctx.close();
}
await navegador.close();
servidor.close();
console.log(errors ? `✗ navegador: ${errors} errors (${oks} correctes)` : `✓ navegador: ${oks} comprovacions`);
process.exit(errors ? 1 : 0);
