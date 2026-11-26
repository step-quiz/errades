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

// Els exemples que la pàgina farà sortir (generador o banc), calculats igual que pagina.js
const PAG = await import('../../js/equacions/pagina.js');
const ERRORS = JSON.parse(fs.readFileSync(path.join(ARREL, 'data', 'errors.json'), 'utf8'));
const BANC = JSON.parse(fs.readFileSync(path.join(ARREL, 'data', 'banc.json'), 'utf8')).exemples;
const sessio = (base, i = 0, nivell = 1, noerrors = false) => PAG.exempleSessio(i, { base, nivell, noerrors, tipus: ERRORS, banc: BANC });
const primera = ex => Object.keys(ex.errades).map(Number).sort((a, b) => a - b)[0];
const [LT_LLAVOR, LT] = (() => {
    for (let s = 1; ; s++) {
        const e = primera(sessio(s));
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
    // fase del terme (a tots els nivells): després de trobar la línia i, toca el terme equivocat
    const tocaTerme = async (ex, i) => clica(`#llibreta [data-tm="${ex.errades[i].terme}"]`);
    const lateral = async () => pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

    // Índex: fins que no es tria l'activitat, els paràmetres són amagats
    await pg.goto(BASE + 'index.html');
    ok(!(await pg.isVisible('#act-params')), "índex: sense activitat triada, els paràmetres són amagats");
    await pg.selectOption('#act-activitat', 'equacions');
    ok(await pg.isVisible('#act-params'), "índex: en triar l'activitat apareixen els paràmetres");
    await pg.selectOption('#act-nivell', '2');
    ok((await pg.inputValue('#act-enllac')).endsWith('equacions.html?nivell=2'), 'índex: enllaç amb nivell 2');
    await pg.selectOption('#act-activitat', 'prioritat');
    await pg.selectOption('#act-encercla', '1');
    await pg.selectOption('#act-reparteix', '1');
    const enll = await pg.inputValue('#act-enllac');
    ok(/prioritat\.html\?nivell=2&encercla=1&llavor=\d+$/.test(enll), 'índex: prioritat, encerclar sempre i llavor generada (iguals per a tothom)');
    await pg.selectOption('#act-total', '10');
    ok((await pg.inputValue('#act-enllac')).includes('llavor=' + enll.split('llavor=')[1]), "índex: la llavor es manté en canviar un altre paràmetre");
    await pg.selectOption('#act-reparteix', '');
    ok(!/llavor/.test(await pg.inputValue('#act-enllac')), 'índex: «Diferents per a cada alumne» treu la llavor');
    ok(/potències/.test(await pg.locator('#act-nivell option[value="2"]').textContent()), "índex: el nivell 2 es descriu segons l'activitat");
    ok((await pg.getAttribute('a.logo', 'href')) === 'https://step-quiz.net/', 'índex: la sabatilla enllaça a step-quiz.net');
    ok(await pg.isVisible('footer.peu'), 'índex: el peu és visible');
    ok(await lateral(), 'índex: desplaçament lateral');

    // Activitat: 2 exemples, llavor fixa
    await pg.goto(BASE + 'equacions.html?totaloperations=2&llavor=11');
    await pg.waitForSelector('#llibreta .ln');
    const errada = primera(sessio(11, 0));
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
    ok(/Sí! L'errada és en aquesta línia/.test(await pg.textContent('#llibreta .msg')), 'línia dolenta: encert');
    ok((await pg.locator('#llibreta .tb').count()) > 1, 'nivell 1: després de la línia es demana el terme');
    await tocaTerme(sessio(11, 0), errada);
    ok(/Exacte: aquest és el terme equivocat/.test(await pg.textContent('#llibreta .msg')), 'nivell 1: terme encertat');
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
    const errada2 = primera(sessio(11, 1));
    await pg.focus('#llibreta');
    await pg.keyboard.press(String(errada2));
    await pg.keyboard.press('Enter');
    ok(/Sí! L'errada és en aquesta línia/.test(await pg.textContent('#llibreta .msg')), 'teclat: encert');
    {
        // fase del terme amb el teclat: → fins al terme equivocat, Enter
        const ex2 = sessio(11, 1), ids = ex2.linies[errada2].map((t, j) => (t === '=' ? -1 : j)).filter(j => j >= 0);
        for (let k = 0; k <= ids.indexOf(ex2.errades[errada2].terme); k++) await pg.keyboard.press('ArrowRight');
        await pg.keyboard.press('Enter');
        ok(/Exacte: aquest és/.test(await pg.textContent('#llibreta .msg')), 'teclat: terme encertat amb ← / →');
    }
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
    await tocaTerme(sessio(LT_LLAVOR), LT);
    await clica('#llibreta [data-pq="0"]');
    await clica('#llibreta [data-co="0"]');
    ok(await pg.evaluate(e => [...Array(e).keys()].slice(1).every(i => document.querySelector(`#llibreta .fila[data-i="${i}"] .mk.c`)), LT), "en acabar, ✓ a totes les línies bones d'abans de l'errada");
    // Nivell 4: dues errades, amb la fase del terme
    await pg.goto(BASE + 'equacions.html?nivell=4&totaloperations=1&llavor=21');
    await pg.waitForSelector('#llibreta .ln');
    const ex4 = sessio(21, 0, 4);
    const [e1, e2] = Object.keys(ex4.errades).map(Number).sort((a, b) => a - b);
    ok(/Errades: 2/.test(await pg.textContent('#llibreta .chips')), 'nivell 4: «Errades: 2»');
    for (const [k, e] of [[0, e1], [1, e2]]) {
        await clica(`#llibreta [data-l="${e}"]`);
        await clica('#llibreta [data-a=comprova]');
        ok((await pg.locator('#llibreta .tb').count()) > 1, `nivell 4, errada ${k + 1}: els termes de la línia es poden tocar`);
        const bo = ex4.errades[e].terme;
        const bons = ex4.errades[e].termes || [bo];
        const dolent = ex4.linies[e].findIndex((t, j) => t !== '=' && !bons.includes(j));
        await clica(`#llibreta [data-tm="${dolent}"]`);
        ok(/Aquest terme està bé/.test(await pg.textContent('#llibreta .msg')), `nivell 4, errada ${k + 1}: un terme bo no és l'equivocat`);
        await clica(`#llibreta [data-tm="${bo}"]`);
        ok(/Exacte: aquest és (el|un dels) termes? equivocats?/.test(await pg.textContent('#llibreta .msg')), `nivell 4, errada ${k + 1}: terme encertat`);
        await clica('#llibreta [data-pq="0"]');
        await clica('#llibreta [data-co="0"]');
        if (k === 0) {
            ok(/Encara en queda una/.test(await pg.textContent('#llibreta .msg')), 'nivell 4: després de la primera, en queda una');
            ok((await pg.locator('#llibreta .arrossega').count()) === 0, 'nivell 4: mentre en queda una, no hi ha cap línia esvaïda');
        }
    }
    ok(await pg.isVisible('.franja-final'), 'nivell 4: franja en acabar');
    const xs = await pg.evaluate(() => [...document.querySelectorAll('#llibreta .fila .ex > .t')].map(e => Math.round(e.getBoundingClientRect().left + e.getBoundingClientRect().width / 2)));
    ok(xs.every(x => Math.abs(x - xs[0]) <= 1), `nivell 4: tots els «=» a la mateixa vertical (${xs})`);
    ok(await pg.locator(`#llibreta .fila[data-i="${e2}"]`).evaluate(el => getComputedStyle(el).opacity === '1'), 'nivell 4: la segona errada es continua veient sencera');

    // Nivell 3: no es diu quantes n'hi ha; cal dir «No n'hi ha cap més»
    await pg.goto(BASE + 'equacions.html?nivell=3&totaloperations=1&llavor=8');
    await pg.waitForSelector('#llibreta .ln');
    const ex3 = sessio(8, 0, 3);
    const e3 = primera(ex3);
    ok(!/Errades:/.test(await pg.textContent('#llibreta .chips')), 'nivell 3: no es diu quantes errades hi ha');
    await clica(`#llibreta [data-l="${e3}"]`);
    await clica('#llibreta [data-a=comprova]');
    await tocaTerme(ex3, e3);
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
    await tocaTerme(sessio(LT_LLAVOR), LT);
    await clica('#llibreta [data-pq="0"]');
    ok(await pg.isVisible('#escrit') && (await pg.locator('#llibreta .tk').count()) === 15, 'escriu=1: casella i teclat');
    const bo = (() => {
        const er = sessio(LT_LLAVOR).errades[LT];
        return er.fitxesBona[er.terme];
    })();
    const tecles = bo.replace(/\{([^|]+)\|([^}]+)\}/, '$1/$2').replace(/\s+/g, '').split('');
    await clica('#llibreta [data-k="0"]');
    await clica('#llibreta [data-k="⌫"]');
    for (const k of tecles) await clica(`#llibreta [data-k="${k === '-' ? '−' : k}"]`);
    await clica('#llibreta [data-escriu] button[type=submit]');
    ok(/Molt bé: així havia de quedar/.test(await pg.textContent('#llibreta .msg')), `escriu=1: el terme «${bo}» escrit amb el teclat és correcte`);

    // Encerclar amb el dit (R3): un cercle al voltant del terme equivocat, i un traç per dues línies
    await pg.goto(BASE + `equacions.html?encercla=1&totaloperations=1&llavor=${LT_LLAVOR}`);
    await pg.waitForSelector('#llibreta .linies.llac');
    ok(/Encercla la primera línia/.test(await pg.textContent('#llibreta .cap-ex')), 'encercla=1: la consigna diu «Encercla»');
    const traca = async punts => {
        await pg.mouse.move(punts[0][0], punts[0][1]);
        await pg.mouse.down();
        for (const [x, y] of punts.slice(1)) await pg.mouse.move(x, y, { steps: 2 });
        await pg.mouse.up();
    };
    const caixa = async sel => pg.locator(sel).first().boundingBox();
    const ultima = sessio(LT_LLAVOR).linies.length - 1;
    const b1 = await caixa('#llibreta .fila[data-i="1"] .ln'), bu = await caixa(`#llibreta .fila[data-i="${ultima}"] .ln`);
    await traca([[b1.x + 40, b1.y + 5], [b1.x + 60, (b1.y + bu.y + bu.height) / 2], [b1.x + 80, bu.y + bu.height - 4]]);
    ok(/^Torna a marcar-ho, si us plau/.test(await pg.textContent('#llibreta .msg')), 'traç per moltes línies: «Torna a marcar-ho»');
    const tm = sessio(LT_LLAVOR).errades[LT].terme;
    const bt = await caixa(`#llibreta .fila[data-i="${LT}"] .ln > .ex [data-j="${tm}"]`);
    const cx = bt.x + bt.width / 2, cy = bt.y + bt.height / 2, rx = bt.width / 2 + 10, ry = bt.height / 2 + 6;
    await traca(Array.from({ length: 25 }, (_, k) => [cx + rx * Math.cos((2 * Math.PI * k) / 24), cy + ry * Math.sin((2 * Math.PI * k) / 24)]));
    ok(new RegExp(`^Has marcat la línia ${LT}, i a dins un terme`).test(await pg.textContent('#llibreta .msg')), 'cercle al voltant d\'un terme: línia i terme marcats');
    ok((await pg.getAttribute('#llibreta svg.traca path', 'd')).startsWith('M'), 'el traç es queda dibuixat');
    await clica('#llibreta [data-a=comprova]');
    ok(/just el terme equivocat/.test(await pg.textContent('#llibreta .msg')), 'cercle al terme equivocat: «I has encerclat just el terme equivocat»');

    // Prioritat d'operacions: un exemple sencer tocant, i el «=» de totes les línies a la mateixa vertical
    {
        const PP = await import('../../js/prioritat/pagina.js');
        let ll = 1;
        while (Object.keys(PP.exempleSessio(0, { base: ll, nivell: 2, noerrors: false }).errades)[0] < 2) ll++;
        const exP = PP.exempleSessio(0, { base: ll, nivell: 2, noerrors: false });
        const eP = Number(Object.keys(exP.errades)[0]);
        await pg.goto(BASE + `prioritat.html?nivell=2&encercla=0&totaloperations=1&llavor=${ll}`);
        await pg.waitForSelector('#llibreta .ln');
        ok(/ha calculat aquesta expressió/.test(await pg.textContent('#llibreta .cap-ex')), 'prioritat: la consigna parla d\'una expressió');
        ok((await pg.textContent('#llibreta .ln.enunciat .ex')).replace(/\s+/g, '').indexOf('=') < 0, "prioritat: l'enunciat no porta «=»");
        await clica('#llibreta [data-l="1"]');
        await clica('#llibreta [data-a=comprova]');
        ok(/^En aquesta línia no s'ha comès cap errada/.test(await pg.textContent('#llibreta .msg')), 'prioritat: una línia bona s\'explica');
        await clica(`#llibreta [data-l="${eP}"]`);
        await clica('#llibreta [data-a=comprova]');
        ok(/Sí! L'errada és en aquesta línia/.test(await pg.textContent('#llibreta .msg')), 'prioritat: encert');
        await tocaTerme(exP, eP);
        await clica('#llibreta [data-pq="0"]');
        await clica('#llibreta [data-co="0"]');
        ok(await pg.isVisible('.franja-final'), 'prioritat: franja en acabar');
        const xsP = await pg.evaluate(() => [...document.querySelectorAll('#llibreta .fila .ex > .t')].filter(e => e.textContent.trim() === '=').map(e => Math.round(e.getBoundingClientRect().left + e.getBoundingClientRect().width / 2)));
        ok(xsP.length >= 3 && xsP.every(x => Math.abs(x - xsP[0]) <= 1), `prioritat: tots els «=» a la mateixa vertical (${xsP})`);
        ok(await lateral(), 'prioritat: desplaçament lateral');
        if (process.env.CAPTURES) await pg.screenshot({ path: path.join(process.env.CAPTURES, `prioritat-${mida.width}.png`), fullPage: true });
    }

    ok(fallades.length === 0, 'errors o peticions externes: ' + fallades.join(' | '));
    await ctx.close();
}
await navegador.close();
servidor.close();
console.log(errors ? `✗ navegador: ${errors} errors (${oks} correctes)` : `✓ navegador: ${oks} comprovacions`);
process.exit(errors ? 1 : 0);
