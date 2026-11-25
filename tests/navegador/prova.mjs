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

const [LT_LLAVOR, LT] = await (async () => {
    const g = await import('../../js/equacions/generador.js');
    const t = JSON.parse(fs.readFileSync(path.join(ARREL, 'data', 'errors.json'), 'utf8'));
    for (let s = 1; ; s++) {
        const e = +Object.keys(g.generaExemple({ llavor: s, nivell: 1, errades: 1 }, t).errades)[0];
        if (e >= 3) return [s, e];
    }
})();

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
    ok(await pg.locator('#llibreta .ln.enunciat .ex').evaluate(e => !/Kalam/.test(getComputedStyle(e).fontFamily)), "l'enunciat va en lletra d'impremta");
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
    // ✓ a totes les línies bones d'abans de l'errada, en acabar (exemple amb l'errada a la línia LT)
    await pg.goto(BASE + `equacions.html?llavor=${LT_LLAVOR}`);
    await pg.waitForSelector('#llibreta .ln');
    await clica(`#llibreta [data-l="${LT}"]`);
    await clica('#llibreta [data-a=comprova]');
    await clica('#llibreta [data-pq="0"]');
    await clica('#llibreta [data-co="0"]');
    ok(await pg.evaluate(e => [...Array(e).keys()].slice(1).every(i => document.querySelector(`#llibreta .fila[data-i="${i}"] .mk.c`)), LT), "en acabar, ✓ a totes les línies bones d'abans de l'errada");
    // Nivell 4: dues errades, amb la fase del terme
    await pg.goto(BASE + 'equacions.html?nivell=4&totaloperations=1&llavor=21');
    await pg.waitForSelector('#llibreta .ln');
    const ex4 = await pg.evaluate(async () => {
        const m = await import('./js/equacions/pagina.js');
        const t = await (await fetch('data/errors.json')).json();
        return m.exempleSessio(0, { base: 21, nivell: 4, noerrors: false, tipus: t, banc: [] });
    });
    const [e1, e2] = Object.keys(ex4.errades).map(Number);
    ok(/Errades: 2/.test(await pg.textContent('#llibreta .chips')), 'nivell 4: «Errades: 2»');
    for (const [k, e] of [[0, e1], [1, e2]]) {
        await clica(`#llibreta [data-l="${e}"]`);
        await clica('#llibreta [data-a=comprova]');
        ok((await pg.locator('#llibreta .tb').count()) > 1, `nivell 4, errada ${k + 1}: els termes de la línia es poden tocar`);
        const bo = ex4.errades[e].terme;
        const dolent = ex4.linies[e].findIndex((t, j) => t !== '=' && j !== bo);
        await clica(`#llibreta [data-tm="${dolent}"]`);
        ok(/Aquest terme està bé/.test(await pg.textContent('#llibreta .msg')), `nivell 4, errada ${k + 1}: un terme bo no és l'equivocat`);
        await clica(`#llibreta [data-tm="${bo}"]`);
        ok(/Exacte: aquest és el terme equivocat/.test(await pg.textContent('#llibreta .msg')), `nivell 4, errada ${k + 1}: terme encertat`);
        await clica('#llibreta [data-pq="0"]');
        await clica('#llibreta [data-co="0"]');
        if (k === 0) {
            ok(/Encara en queda una/.test(await pg.textContent('#llibreta .msg')), 'nivell 4: després de la primera, en queda una');
            ok((await pg.locator('#llibreta .arrossega').count()) === 0, 'nivell 4: mentre en queda una, no hi ha cap línia esvaïda');
        }
    }
    ok(await pg.isVisible('.franja-final'), 'nivell 4: franja en acabar');
    const xs = await pg.evaluate(() => [...document.querySelectorAll('#llibreta .fila .ln > .ex > .t')].map(e => Math.round(e.getBoundingClientRect().left + e.getBoundingClientRect().width / 2)));
    ok(xs.every(x => Math.abs(x - xs[0]) <= 1), `nivell 4: tots els «=» a la mateixa vertical (${xs})`);
    ok(await pg.locator(`#llibreta .fila[data-i="${e2}"]`).evaluate(el => getComputedStyle(el).opacity === '1'), 'nivell 4: la segona errada es continua veient sencera');

    // Nivell 3: no es diu quantes n'hi ha; cal dir «No n'hi ha cap més»
    await pg.goto(BASE + 'equacions.html?nivell=3&totaloperations=1&llavor=8');
    await pg.waitForSelector('#llibreta .ln');
    const ex3 = await pg.evaluate(async () => {
        const m = await import('./js/equacions/pagina.js');
        const t = await (await fetch('data/errors.json')).json();
        return m.exempleSessio(0, { base: 8, nivell: 3, noerrors: false, tipus: t, banc: [] });
    });
    const e3 = Number(Object.keys(ex3.errades)[0]);
    ok(!/Errades:/.test(await pg.textContent('#llibreta .chips')), 'nivell 3: no es diu quantes errades hi ha');
    await clica(`#llibreta [data-l="${e3}"]`);
    await clica('#llibreta [data-a=comprova]');
    await clica('#llibreta [data-pq="0"]');
    await clica('#llibreta [data-co="0"]');
    ok(!(await pg.isVisible('.franja-final')), "nivell 3: trobar-la no acaba l'exemple");
    await clica('#llibreta [data-a=cap]');
    ok(await pg.isVisible('.franja-final'), "nivell 3: «No n'hi ha cap més» l'acaba");
    if (process.env.CAPTURES) await pg.screenshot({ path: path.join(process.env.CAPTURES, `n3-${mida.width}.png`), fullPage: true });

    // escriu=1: «Corregeix-la» escrivint el terme amb el teclat de la pàgina
    await pg.goto(BASE + `equacions.html?escriu=1&totaloperations=1&llavor=${LT_LLAVOR}`);
    await pg.waitForSelector('#llibreta .ln');
    await clica(`#llibreta [data-l="${LT}"]`);
    await clica('#llibreta [data-a=comprova]');
    await clica('#llibreta [data-pq="0"]');
    ok(await pg.isVisible('#escrit') && (await pg.locator('#llibreta .tk').count()) === 15, 'escriu=1: casella i teclat');
    const bo = await pg.evaluate(async ll => {
        const m = await import('./js/equacions/pagina.js');
        const t = await (await fetch('data/errors.json')).json();
        const e = m.exempleSessio(0, { base: ll, nivell: 1, noerrors: false, tipus: t, banc: [] });
        const [j, er] = Object.entries(e.errades)[0];
        return er.fitxesBona[er.terme];
    }, LT_LLAVOR);
    const tecles = bo.replace(/\{([^|]+)\|([^}]+)\}/, '$1/$2').replace(/\s+/g, '').split('');
    await clica('#llibreta [data-k="0"]');
    await clica('#llibreta [data-k="⌫"]');
    for (const k of tecles) await clica(`#llibreta [data-k="${k === '-' ? '−' : k}"]`);
    await clica('#llibreta [data-escriu] button[type=submit]');
    ok(/Molt bé: així havia de quedar/.test(await pg.textContent('#llibreta .msg')), `escriu=1: el terme «${bo}» escrit amb el teclat és correcte`);

    ok(fallades.length === 0, 'errors o peticions externes: ' + fallades.join(' | '));
    await ctx.close();
}
await navegador.close();
servidor.close();
console.log(errors ? `✗ navegador: ${errors} errors (${oks} correctes)` : `✓ navegador: ${oks} comprovacions`);
process.exit(errors ? 1 : 0);
