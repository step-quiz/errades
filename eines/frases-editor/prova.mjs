import { createRequire } from 'node:module';
const require = createRequire(new URL('../../package.json', import.meta.url));
const { chromium } = require('playwright-core');
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const fallades = [];
for (const [nom, mida] of [['ordinador', { width: 1280, height: 900 }], ['mòbil', { width: 375, height: 760 }]]) {
    const pg = await b.newPage({ viewport: mida });
    pg.on('pageerror', e => fallades.push(nom + ': ' + e));
    await pg.addInitScript(() => {
        const escrits = [];
        window.__escrits = escrits;
        const col = name => ({
            doc: id => ({ set: async d => { escrits.push([name + '/' + id, d]); }, get: async () => ({ exists: false }) }),
            onSnapshot: ok => { setTimeout(() => ok({ docs: name === 'rep' ? [{ id: 'DIST', data: () => ({ text: 'Resposta DIST' }) }] : [] }), 30); return () => {}; },
        });
        window.claude = { use: async k => (k === 'db' ? { collection: col, doc: p => ({ set: async d => escrits.push([p, d]), get: async () => ({ exists: false }), onSnapshot: () => () => {} }) } : null) };
    });
    await pg.goto(new URL('./index.html', import.meta.url).href);
    await pg.waitForTimeout(500);
    const r = await pg.evaluate(() => ({
        sits: document.querySelectorAll('#sits .card').length, comp: document.querySelectorAll("#compartides li").length, grups: document.querySelectorAll('#grups .grp').length,
        sav: document.querySelector('#sav').textContent, rep: !document.querySelector('[data-r="DIST"]').hidden,
        marks: document.querySelectorAll('#sits mark').length, warns: [...document.querySelectorAll('#sits .warn')].filter(w => w.textContent.trim()).map(w => w.textContent).slice(0, 5),
        lateral: document.documentElement.scrollWidth <= innerWidth,
    }));
    console.log(nom, JSON.stringify(r));
    // edita una frase compartida: s'ha d'actualitzar a totes les situacions
    const ta = pg.locator('#s-ST1 .fr.bona textarea');
    await ta.fill("Ha passat el $[terme]$ a l'altre costat sense canviar-li el signe.");
    const copies = await pg.evaluate(() => [...document.querySelectorAll('textarea[data-f="F16"]')].map(t => t.value));
    console.log('còpies F16 iguals:', copies.length, copies.every(v => v === copies[0]));
    await pg.selectOption('#s-CO select[data-a=afegeix]', '__nova');
    await pg.keyboard.type('Ha confós el $[A]$ amb el $[B]$ i [zz].');
    await pg.waitForTimeout(200);
    const w = await pg.evaluate(() => [...document.querySelectorAll('#s-CO .warn')].map(x => x.textContent).filter(Boolean));
    console.log('avís marcador desconegut:', w);
    await pg.click('#s-DIST .fr[data-rol=dolenta] [data-a=bona]');
    await pg.click('#g-G1 [data-gd=unifica]');
    await pg.check('#g-G1 input[value=F61]');
    await pg.waitForTimeout(1200);
    const esc = await pg.evaluate(() => window.__escrits.map(e => e[0]));
    console.log('desats:', [...new Set(esc)].join(', '), '| comptador:', await pg.textContent('#cnt'));
    await pg.screenshot({ path: new URL(`./cap-${mida.width}.png`, import.meta.url).pathname, fullPage: false });
    await pg.close();
}
console.log('errors:', fallades);
await b.close();
