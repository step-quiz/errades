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
//   · cap error de JavaScript, cap petició fora del servidor, cap desplaçament lateral;
//   · l'auditoria del 28/11/2026 (etapa 1): «hover» només amb el ratolí, doble toc bloquejat, res no es mou
//     (missatge a la columna de l'esquerra o a la barra de baix, termes), tornar a tocar = «Comprova»,
//     línies d'abans de l'errada trobada, franja de punts per desplaçar la pàgina, cap barra lateral a la llibreta.
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
// La Content-Security-Policy de les pàgines (_headers, bloc «/*»), perquè la prova vegi el que farà Cloudflare (auditoria 2, C7)
const CSP = (fs.readFileSync(path.join(ARREL, '_headers'), 'utf8').split(/\n\/\*\n/)[1] || '').match(/Content-Security-Policy: (.*)/)[1];
const servidor = http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const f = path.join(ARREL, u === '/' ? 'index.html' : u);
    if (!f.startsWith(ARREL) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
        res.writeHead(404);
        return res.end();
    }
    res.writeHead(200, { 'Content-Type': TIPUS[path.extname(f)] || 'application/octet-stream', 'Content-Security-Policy': CSP });
    fs.createReadStream(f).pipe(res);
});
await new Promise(r => servidor.listen(0, r));
const BASE = `http://127.0.0.1:${servidor.address().port}/`;

// Els exemples que la pàgina farà sortir (generador o banc), calculats igual que pagina.js
const PAG = await import('../../js/equacions/pagina.js');
const { termeUnic } = await import('../../js/motor/estat.js');
const ERRORS = JSON.parse(fs.readFileSync(path.join(ARREL, 'data', 'errors.json'), 'utf8'));
const BANC = JSON.parse(fs.readFileSync(path.join(ARREL, 'data', 'banc.json'), 'utf8')).exemples;
const sessio = (base, i = 0, nivell = 1, noerrors = false) => PAG.exempleSessio(i, { base, nivell, noerrors, banc: BANC });
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
    pg.on('console', m => {
        if (/Content Security Policy|Refused to/.test(m.text())) fallades.push('CSP: ' + m.text());
    });
    pg.on('request', r => {
        if (!r.url().startsWith(BASE)) fallades.push('petició externa: ' + r.url());
    });
    // els tocs esperen el bloqueig de 300 ms que hi ha després de cada canvi (auditoria T2)
    const clica = async sel => (await pg.waitForTimeout(330), tactil ? pg.tap(sel) : pg.click(sel));
    const comprovaSel = tactil ? '#llibreta .barra-msg [data-a=comprova]' : '#llibreta .cv [data-a=comprova]';
    const posicions = async () => pg.evaluate(() => [...document.querySelectorAll('#llibreta .fila')].map(f => Math.round(f.getBoundingClientRect().top + scrollY)));
    // fase del terme (a tots els nivells): després de trobar la línia i, toca el terme equivocat
    // (si la línia només té un terme possible, com «x = 5/35», la fase se salta: auditoria P6)
    // es toca al centre del terme, com un dit: si la zona tàctil d'un terme veí s'hi encavalca, mana el terme de sota
    const tocaAl = async sel => {
        await pg.waitForTimeout(330);
        const q = await pg.locator(sel).boundingBox();
        await (tactil ? pg.touchscreen.tap(q.x + q.width / 2, q.y + q.height / 2) : pg.mouse.click(q.x + q.width / 2, q.y + q.height / 2));
    };
    const tocaTerme = async (ex, i) => (termeUnic(ex, i) ? null : tocaAl(`#llibreta [data-tm="${ex.errades[i].terme}"]`));
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
    // Etapa 3: capçalera d'una línia, sense «← Activitats», amb els punts de progrés; la lletra de l'alumne
    ok((await pg.locator('.barra a').count()) === 0, 'E1: sense «← Activitats»');
    ok((await pg.locator('#progres .pp i').count()) === 2 && (await pg.locator('#progres .pp i.ara').count()) === 1, 'D2: un punt de progrés per exercici, el d\'ara marcat');
    if (!tactil) ok(await pg.evaluate(() => document.querySelector('.barra').getBoundingClientRect().height <= 52), 'D1: capçalera compacta (≤ 52 px)');
    ok(await pg.locator('#llibreta .fila[data-i="1"] .ln').evaluate(e => getComputedStyle(e).fontFamily.startsWith('"Patrick Hand"')), 'F1: la lletra de l\'alumne és Patrick Hand');
    const errada = primera(sessio(11, 0));
    const bona = errada === 1 ? 2 : 1;
    ok((await pg.locator('#llibreta [data-a=comprova]').count()) === 0, 'al principi no hi ha cap botó «Comprova»');
    // Etapa 2: «Exercici n de N», el xip d'intents, els passos i la consigna de cada fase sense canviar d'alçada
    ok(/Exercici 1 de 2/.test(await pg.textContent('#progres')), 'C11: «Exercici 1 de 2»');
    ok(/Intents: ●●●/.test(await pg.textContent('#llibreta .chip.intents')), 'C3: «Intents: ●●●»');
    ok((await pg.textContent('#llibreta .passos li.ara')).includes('Línia'), 'C1: pas d\'ara, «Línia»');
    const altCap = async () => pg.evaluate(() => Math.round(document.querySelector('#llibreta .cap-ex').getBoundingClientRect().height));
    const alt0 = await altCap();
    const abans = await posicions();
    await clica(`#llibreta [data-l="${bona}"]`);
    if (tactil) ok((await pg.locator(comprovaSel).count()) === 1, 'mòbil: «Comprova» surt a la barra de baix');
    else ok((await pg.locator(`#llibreta .fila[data-i="${bona}"] .cv [data-a=comprova]`).count()) === 1, '«Comprova» surt a l\'esquerra de la línia triada');
    ok(await pg.evaluate(t => document.documentElement.classList.contains('tacte') === t, tactil), `T1: html.tacte ${tactil ? 'amb el dit' : 'no, amb el ratolí'}`);
    await clica(comprovaSel);
    ok(/^Aquesta línia és correcta, perquè /.test(await pg.textContent('#llibreta .msg')), 'línia bona: explica per què és correcta (sense salt de línia)');
    ok((await pg.locator(tactil ? '#llibreta .barra-msg .msg' : '#llibreta .msg-cv .msg').count()) === 1, `T5: el missatge va ${tactil ? 'a la barra de baix' : "a la columna de l'esquerra"}`);
    ok(JSON.stringify(await posicions()) === JSON.stringify(abans), 'T5: triar i comprovar una línia bona no mou cap línia');
    // E2: recarregar a mig exercici: la línia bona continua revisada (✓) i l'intent gastat
    await pg.reload();
    await pg.waitForSelector('#llibreta .ln');
    ok((await pg.locator(`#llibreta .fila[data-i="${bona}"] .mk.c`).count()) === 1 && /Intents: ●●○/.test(await pg.textContent('#llibreta .chip.intents')), 'E2: recarregar a mig exercici continua on era');
    ok(await pg.locator('#llibreta .ln.enunciat').evaluate(e => getComputedStyle(e).cursor) === 'not-allowed', 'la línia 0 té el cursor de prohibit');
    ok((await pg.textContent('#llibreta .ln.enunciat .n')).trim() === '0', 'la primera línia és la 0');
    ok((await pg.locator('#llibreta .mk.c').count()) === 1, 'línia bona: ✓ de llapis');
    // C10: tornar a tocar la línia triada és «Comprova»
    await clica(`#llibreta [data-l="${errada}"]`);
    await clica(`#llibreta [data-l="${errada}"]`);
    ok(/en aquesta línia hi ha una errada/.test(await pg.textContent('#llibreta .msg')), 'línia dolenta (tocant-la dues vegades): encert');
    if (errada > 1) ok((await pg.locator('#llibreta [data-l="1"]').count()) === 0 && (await pg.locator('#llibreta .fila[data-i="1"] .mk.c').count()) === 1, "B4: les línies d'abans de l'errada trobada ja no es poden triar i porten ✓");
    {
        // B5/T6: els termes es converteixen en botons sense moure's
        const x = await pg.evaluate(e => [...document.querySelectorAll(`#llibreta .fila[data-i="${e}"] .ex > * > *`)].map(t => Math.round(t.getBoundingClientRect().left * 2) / 2), errada);
        ok(x.length > 1, 'fase del terme: termes');
        const caixa = await pg.locator('#llibreta .tb').first().evaluate(b => { const r = b.getBoundingClientRect(), a = getComputedStyle(b, '::after'); return { w: parseFloat(a.width), h: parseFloat(a.height), bw: r.width }; });
        ok(caixa.w >= 44 && caixa.h >= 44, `T6: zona tàctil dels termes ≥ 44 × 44 px (${caixa.w} × ${caixa.h})`);
        globalThis.__xTermes = x;
    }
    ok((await pg.locator('#llibreta .tb').count()) > 1, 'nivell 1: després de la línia es demana el terme');
    await clica(`#llibreta [data-tm="${sessio(11, 0).errades[errada].terme}"]`);
    ok(/Has trobat el terme equivocat/.test(await pg.textContent('#llibreta .msg')), 'nivell 1: terme encertat');
    {
        const x = await pg.evaluate(e => [...document.querySelectorAll(`#llibreta .fila[data-i="${e}"] .ex > * > *`)].map(t => Math.round(t.getBoundingClientRect().left * 2) / 2), errada);
        ok(JSON.stringify(x) === JSON.stringify(globalThis.__xTermes), `B5: els termes no es mouen en passar de botons a text (${x} / ${globalThis.__xTermes})`);
    }

    await pg.waitForTimeout(700); // el desplaçament suau
    const vista = await pg.evaluate(e => {
        const r = s => document.querySelector(s).getBoundingClientRect();
        const a = r(`#llibreta .fila[data-i="${e - 1}"]`), b = r(`#llibreta .fila[data-i="${e}"]`), f = r('#llibreta .fase');
        const atenuades = [...document.querySelectorAll('#llibreta .fila')].filter(x => x.classList.contains('atenua')).map(x => +x.dataset.i);
        return { dins: a.top >= 0 && b.bottom <= innerHeight && f.top >= 0 && f.bottom <= innerHeight, atenuades, n: document.querySelectorAll('#llibreta .fila').length, opcions: document.querySelectorAll('#llibreta .fase .b').length };
    }, errada);
    ok(vista.dins, 'la línia anterior, la línia equivocada i les opcions es veuen a la pantalla');
    ok(vista.opcions === 3, '«Per què?» amb 3 opcions');
    ok((await pg.textContent('#llibreta .passos li.ara')).includes('Per què') && (await pg.locator('#llibreta .passos li.fet').count()) === 2, 'C1: pas d\'ara, «Per què» (Línia i Terme fets)');
    ok((await pg.textContent('#llibreta .ins-pila')).includes('Tria per què és una errada.'), 'C1: la consigna diu la tasca d\'ara');
    ok((await altCap()) === alt0, `C1: la capçalera de l'exercici no canvia d'alçada (${alt0})`);
    ok((await pg.locator('#llibreta .bloc').count()) === 1 && (await pg.locator('#llibreta .bloc .msg + .fase').count()) === 1, 'C2: el missatge i la pregunta, en un sol bloc');
    ok(vista.atenuades.length === vista.n - 2 && !vista.atenuades.includes(errada) && !vista.atenuades.includes(errada - 1), 'les altres línies queden esvaïdes');
    await clica('#llibreta [data-pq="0"]');
    {
        // C6: la resposta de «Per què?» es queda a la vista, amb la triada i la correcta marcades
        const exS = sessio(11, 0), bonaPq = exS.errades[errada].perque.findIndex(([, b]) => b);
        ok((await pg.locator('#llibreta .bloc .resposta .resp li').count()) === (bonaPq === 0 ? 1 : 2) && (await pg.locator('#llibreta .resp li.bona').count()) === 1 && (await pg.locator('#llibreta .resp li.triada').count()) === (bonaPq === 0 ? 0 : 1), 'C6: «Per què?» contestada: la triada i la correcta, marcades');
        ok((await pg.locator('#llibreta .fase [data-co]').count()) === 3, 'C6: i a sota, «Corregeix-la»');
        globalThis.__bonaPq = bonaPq;
    }
    await clica('#llibreta [data-co="0"]');
    ok(await pg.isVisible('.franja-final'), 'franja «Següent» a la vista');
    ok(/punts/.test(await pg.textContent('.franja-final')), 'la franja diu els punts');
    ok(/Exercici finalitzat/.test(await pg.textContent('.franja-final')), 'C4: la franja diu «Exercici finalitzat»');
    {
        // C5-A: 2 menys per la línia bona assenyalada i 1 menys per cada resposta equivocada
        const exS = sessio(11, 0), esp = 10 - 2 - (globalThis.__bonaPq === 0 ? 0 : 1) - (exS.errades[errada].opcions[0][1] ? 0 : 1);
        ok((await pg.textContent('.franja-final .franja-punts')).includes(`+${esp} punts`), `C5-A: ${esp} punts`);
        ok((await pg.locator('#llibreta .bloc .resposta').count()) === 2, 'C6: en acabar, les dues respostes es queden a la vista');
    }
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
    ok(/en aquesta línia hi ha una errada/.test(await pg.textContent('#llibreta .msg')), 'teclat: encert');
    {
        // fase del terme amb el teclat: → fins al terme equivocat, Enter
        const ex2 = sessio(11, 1), ids = ex2.linies[errada2].map((t, j) => (t === '=' ? -1 : j)).filter(j => j >= 0);
        if (termeUnic(ex2, errada2)) ok((await pg.locator('#llibreta .fase [data-pq]').count()) === 3, 'P6: línia amb un sol terme: directament «Per què?»');
        else {
            for (let k = 0; k <= ids.indexOf(ex2.errades[errada2].terme); k++) await pg.keyboard.press('ArrowRight');
            await pg.keyboard.press('Enter');
            ok(/Has trobat /.test(await pg.textContent('#llibreta .msg')), 'teclat: terme encertat amb ← / →');
        }
    }
    await pg.keyboard.press('Enter'); // «Per què?»: primer botó amb focus
    await pg.keyboard.press('Enter'); // «Corregeix-la»: primer botó amb focus
    ok(await pg.isVisible('.franja-final'), 'teclat: franja a la vista');
    await pg.keyboard.press('Enter'); // «Veure resultats»
    await pg.waitForSelector('#final:not([hidden])');
    ok(/Resum/.test(await pg.textContent('#final h2')) && (await pg.locator('#final .resum li').count()) === 2, 'E3: pantalla final «Resum» amb 2 exercicis');
    ok(/La nota és:/.test(await pg.textContent('#final .nota')) && /\/ 10/.test(await pg.textContent('#final .nota-v')), 'E3: «La nota és: … / 10»');
    ok((await pg.locator('#final a').count()) === 0 && (await pg.locator('#final #informe').count()) === 1 && (await pg.locator('#final #torna').count()) === 1, 'E1/E3: «📋 Informe» i «🔄 Tornar a jugar», cap enllaç a l\'índex');
    await clica('#informe');
    ok((await pg.locator('#final .inf-i').count()) === 2 && (await pg.locator('#final .inf-t').count()) === 2 && (await pg.locator('#final .inf-bona').count()) >= 1, 'E3: l\'informe, amb els encerts, les errades i la línia bona de cada errada');
    ok(/\S/.test(await pg.textContent('#final .inf-l')) && !/undefined/.test(await pg.textContent('#final')), 'E3: l\'informe diu el tipus de cada errada');
    // E2: la pantalla final també es desa: en recarregar, hi torna
    await pg.reload();
    await pg.waitForSelector('#final:not([hidden])');
    ok(/Resum/.test(await pg.textContent('#final h2')) && (await pg.locator('#final .resum li').count()) === 2, 'E2: recarregar la pàgina acabada torna a la pantalla final');
    if (process.env.CAPTURES) await pg.screenshot({ path: path.join(process.env.CAPTURES, `final-${mida.width}.png`) });
    // «Tornar a jugar» demana confirmació, com a operacions: primer «Cancel·la» (no passa res), després «D'acord»
    pg.once('dialog', d => d.dismiss());
    await clica('#torna');
    ok(await pg.isVisible('#final'), 'E3: «Tornar a jugar» cancel·lat: es queda a la pantalla final');
    pg.once('dialog', d => d.accept());
    await clica('#torna');
    await pg.waitForSelector('#llibreta .ln');
    ok(await pg.isHidden('#final'), '«Torna a començar» torna a la llibreta');
    await pg.reload();
    await pg.waitForSelector('#llibreta .ln');
    ok(await pg.isHidden('#final'), "E2: després de «Torna a començar», recarregar no torna a la pantalla final");
    if (process.env.CAPTURES) {
        await pg.goto(BASE + 'equacions.html?nivell=2&llavor=5');
        await pg.waitForSelector('#llibreta .ln');
        await pg.screenshot({ path: path.join(process.env.CAPTURES, `nivell2-${mida.width}.png`), fullPage: true });
    }
    // «Per què?» amb la paraula de l'índex (membre=banda) i la negreta de les frases del David
    {
        const [ll, e] = (() => {
            for (let s = 1; s < 3000; s++) {
                const ex = sessio(s);
                const j = primera(ex);
                if (ex.errades[j].perque.some(([t]) => /\bmembres?\b/.test(t)) && ex.errades[j].perque.some(([t]) => t.includes('**'))) return [s, j];
            }
        })();
        await pg.goto(BASE + `equacions.html?totaloperations=1&llavor=${ll}&membre=banda`);
        await pg.waitForSelector('#llibreta .ln');
        await clica(`#llibreta [data-l="${e}"]`);
        await clica('#llibreta [data-a=comprova]');
        await tocaTerme(sessio(ll), e);
        const fase = await pg.textContent('#llibreta .fase');
        ok(/banda/.test(fase) && !/\[|membre/.test(fase), `«Per què?» amb «banda» i cap marcador: ${fase}`);
        ok((await pg.locator('#llibreta .fase b').count()) > 0 && !/\*\*/.test(fase), '«Per què?»: la negreta es veu com a negreta');
        if (process.env.CAPTURES) await pg.screenshot({ path: path.join(process.env.CAPTURES, `perque-${mida.width}.png`), fullPage: true });
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
    ok(/Trobades: 0 de 2/.test(await pg.textContent('#llibreta .chips')), 'nivell 4: «Trobades: 0 de 2»');
    for (const [k, e] of [[0, e1], [1, e2]]) {
        await clica(`#llibreta [data-l="${e}"]`);
        await clica('#llibreta [data-a=comprova]');
        if (termeUnic(ex4, e)) {
            ok(/Molt bé, en aquesta línia hi ha una errada/.test(await pg.textContent('#llibreta .msg')) && (await pg.locator('#llibreta .fase [data-pq]').count()) === 3, `nivell 4, errada ${k + 1}: P6, un sol terme, directament «Per què?»`);
            await pg.waitForTimeout(400);
            await clica('#llibreta [data-pq="0"]');
            await clica('#llibreta [data-co="0"]');
            continue;
        }
        ok((await pg.locator('#llibreta .tb').count()) > 1, `nivell 4, errada ${k + 1}: els termes de la línia es poden tocar`);
        const bo = ex4.errades[e].terme;
        const bons = ex4.errades[e].termes || [bo];
        const dolent = ex4.linies[e].findIndex((t, j) => t !== '=' && !bons.includes(j));
        await clica(`#llibreta [data-tm="${dolent}"]`);
        ok(/No és aquest el terme que busquem/.test(await pg.textContent('#llibreta .msg')), `nivell 4, errada ${k + 1}: un terme bo no és l'equivocat`);
        await clica(`#llibreta [data-tm="${bo}"]`);
        ok(/Has trobat (el|un dels) termes? equivocats?/.test(await pg.textContent('#llibreta .msg')), `nivell 4, errada ${k + 1}: terme encertat`);
        if (k === 0) {
            // T2: un segon toc immediat (doble toc) no respon «Per què?»
            // (un clic de punter, detail 1, enviat just després de pintar: el toc real pot trigar més, si la pàgina es desplaça)
            await pg.evaluate(() => document.querySelector('#llibreta [data-pq="1"]').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 })));
            ok((await pg.locator('#llibreta .fase [data-pq]').count()) === 3, 'T2: un toc just després de canviar de fase no compta');
        }
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
    // (a 360 px algunes línies ja no hi caben, i la llibreta s'hi pot desplaçar: només a l'ordinador)
    if (!tactil) ok(await pg.evaluate(() => { const l = document.querySelector('#llibreta .linies'); return l.scrollWidth <= l.clientWidth + 1; }), 'B1: amb els parèntesis grans, la llibreta no té barra lateral');
    ok(await pg.locator(`#llibreta .fila[data-i="${e2}"]`).evaluate(el => getComputedStyle(el).opacity === '1'), 'nivell 4: la segona errada es continua veient sencera');

    // Nivell 3: no es diu quantes n'hi ha; cal dir «No n'hi ha cap més»
    await pg.goto(BASE + 'equacions.html?nivell=3&totaloperations=1&llavor=8');
    await pg.waitForSelector('#llibreta .ln');
    const ex3 = sessio(8, 0, 3);
    const e3 = primera(ex3);
    ok(/Trobades: 0(?! de)/.test(await pg.textContent('#llibreta .chips')), 'nivell 3: no es diu quantes errades hi ha («Trobades: 0»)');
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
    ok(/Molt bé\./.test(await pg.textContent('#llibreta .msg')), `escriu=1: el terme «${bo}» escrit amb el teclat és correcte`);

    // Encerclar amb el dit (R3): un cercle al voltant del terme equivocat, i un traç per dues línies
    // (al mòbil, totes les pàgines d'abans ja eren de traç, i la demostració ja s'havia vist: s'oblida)
    await pg.evaluate(() => localStorage.removeItem('errades-demo-encercla'));
    await pg.goto(BASE + `equacions.html?encercla=1&totaloperations=1&llavor=${LT_LLAVOR}`);
    await pg.waitForSelector('#llibreta .linies.llac');
    ok(/Encercla la primera línia/.test(await pg.textContent('#llibreta .cap-ex')), 'encercla=1: la consigna diu «Encercla»');
    // C8: la demostració del traç surt el primer cop en aquest navegador, i després ja no
    await pg.waitForTimeout(300);
    ok((await pg.locator('#llibreta .demo ellipse').count()) === 1, 'C8: el primer cop, la demostració del traç');
    await pg.reload();
    await pg.waitForSelector('#llibreta .linies.llac');
    await pg.waitForTimeout(300);
    ok((await pg.locator('#llibreta .demo').count()) === 0, 'C8: el segon cop (recordat al navegador), ja no surt');
    ok(await pg.evaluate(() => getComputedStyle(document.querySelector('#llibreta .linies .ln')).touchAction === 'none' && getComputedStyle(document.querySelector('#llibreta .linies')).touchAction === 'auto' && getComputedStyle(document.querySelector('#llibreta .linies'), '::before').backgroundImage.includes('radial-gradient')), "T3: sobre les línies el dit dibuixa; a la franja de punts de l'esquerra, desplaça la pàgina");
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
    ok(/^Has de tornar a marcar-ho, perquè/.test(await pg.textContent('#llibreta .msg')), 'traç per moltes línies: «Torna a marcar-ho»');
    const tm = sessio(LT_LLAVOR).errades[LT].terme;
    // la línia ja triada, i un cercle nou: mentre el dit no s'aixeca, cap línia no es veu marcada (el David, 26/11/2026)
    // (la posició del terme, després del toc: al mòbil, tocar la línia pot desplaçar la pàgina)
    await clica(`#llibreta [data-l="${LT}"]`);
    await pg.waitForTimeout(400);
    const bt = await caixa(`#llibreta .fila[data-i="${LT}"] .ln > .ex [data-j="${tm}"]`);
    const cx = bt.x + bt.width / 2, cy = bt.y + bt.height / 2, rx = bt.width / 2 + 10, ry = bt.height / 2 + 6;
    const cercle = Array.from({ length: 25 }, (_, k) => [cx + rx * Math.cos((2 * Math.PI * k) / 24), cy + ry * Math.sin((2 * Math.PI * k) / 24)]);
    await pg.mouse.move(cercle[0][0], cercle[0][1]);
    await pg.mouse.down();
    for (const [x, y] of cercle.slice(1)) await pg.mouse.move(x, y, { steps: 2 });
    const durant = await pg.evaluate(() => [...document.querySelectorAll('#llibreta .ln')].map(l => getComputedStyle(l)).filter(c => c.backgroundColor !== 'rgba(0, 0, 0, 0)' || !/rgba\(0, 0, 0, 0\)|transparent/.test(c.borderTopColor)).length + (document.querySelector('#llibreta .cv .b') ? getComputedStyle(document.querySelector('#llibreta .cv .b')).visibility === 'visible' : 0));
    ok(durant === 0, `mentre s'encercla, cap línia no es veu marcada ni ressaltada (${durant})`);
    await pg.mouse.up();
    ok(await pg.locator(`#llibreta .fila[data-i="${LT}"] .ln`).evaluate(l => l.classList.contains('sel') && getComputedStyle(l).backgroundColor !== 'rgba(0, 0, 0, 0)'), "en aixecar el dit, la línia es marca");
    ok(new RegExp(`^Has marcat un terme en la línia ${LT}\.`).test(await pg.textContent('#llibreta .msg')), 'cercle al voltant d\'un terme: línia i terme marcats');
    ok((await pg.getAttribute('#llibreta svg.traca path', 'd')).startsWith('M'), 'el traç es queda dibuixat');
    await clica('#llibreta [data-a=comprova]');
    ok(/has localitzat la línia i el terme/.test(await pg.textContent('#llibreta .msg')), 'cercle al terme equivocat: «I has encerclat just el terme equivocat»');

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
        ok(/^Aquesta línia és correcta, perquè/.test(await pg.textContent('#llibreta .msg')), 'prioritat: una línia bona s\'explica');
        await clica(`#llibreta [data-l="${eP}"]`);
        await clica('#llibreta [data-a=comprova]');
        ok(/en aquesta línia hi ha una errada/.test(await pg.textContent('#llibreta .msg')), 'prioritat: encert');
        await tocaTerme(exP, eP);
        await clica('#llibreta [data-pq="0"]');
        await clica('#llibreta [data-co="0"]');
        ok(await pg.isVisible('.franja-final'), 'prioritat: franja en acabar');
        const xsP = await pg.evaluate(() => [...document.querySelectorAll('#llibreta .fila .ex > .t')].filter(e => e.textContent.trim() === '=').map(e => Math.round(e.getBoundingClientRect().left + e.getBoundingClientRect().width / 2)));
        ok(xsP.length >= 3 && xsP.every(x => Math.abs(x - xsP[0]) <= 1), `prioritat: tots els «=» a la mateixa vertical (${xsP})`);
        ok(await lateral(), 'prioritat: desplaçament lateral');
        {
            // D3: el bloc de les expressions, centrat a la línia
            const bloc = await pg.evaluate(() => {
                const ex = [...document.querySelectorAll('#llibreta .ln > .ex')].map(e => e.getBoundingClientRect());
                const ts = [...document.querySelectorAll('#llibreta .ln > .ex > *')].map(e => e.getBoundingClientRect()).filter(b => b.width);
                return { mig: (ex[0].left + ex[0].right) / 2, a: Math.min(...ts.map(b => b.left)), b: Math.max(...ts.map(b => b.right)) };
            });
            ok(Math.abs((bloc.a + bloc.b) / 2 - bloc.mig) < 40, `D3: prioritat, el bloc centrat (${Math.round((bloc.a + bloc.b) / 2)} / ${Math.round(bloc.mig)})`);
        }
        if (process.env.CAPTURES) await pg.screenshot({ path: path.join(process.env.CAPTURES, `prioritat-${mida.width}.png`), fullPage: true });
    }

    // C2 i P12: la capçalera, de la taula única; amb noerrors no es diu quantes errades hi ha
    await pg.goto(BASE + 'equacions.html?nivell=1&noerrors=1&llavor=3');
    await pg.waitForSelector('#llibreta .ln');
    ok((await pg.textContent('#nivell')) === 'Nivell 1 · sense parèntesis · pot ser que no hi hagi cap errada', `P12: capçalera amb noerrors (${await pg.textContent('#nivell')})`);
    await pg.goto(BASE + 'prioritat.html?nivell=5&llavor=3');
    await pg.waitForSelector('#llibreta .ln');
    ok((await pg.textContent('#nivell')) === 'Nivell 5 · una o dues errades, sense dir-ho', 'C2: capçalera de la prioritat');
    await pg.goto(BASE + 'index.html');
    ok(!(await pg.content()).includes('advertir'), "C2: l'índex ja no diu «sense advertir-ho»");

    ok(fallades.length === 0, 'errors o peticions externes: ' + fallades.join(' | '));
    await ctx.close();
}
await navegador.close();
servidor.close();
console.log(errors ? `✗ navegador: ${errors} errors (${oks} correctes)` : `✓ navegador: ${oks} comprovacions`);
process.exit(errors ? 1 : 0);
