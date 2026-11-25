// tests/lib.js — un mínim per a les proves, sense dependències.
let oks = 0;
const errors = [];
export function ok(cond, msg) {
    if (cond) oks++;
    else errors.push(msg);
}
export function igual(a, b, msg) {
    ok(JSON.stringify(a) === JSON.stringify(b), `${msg}\n      esperat: ${JSON.stringify(b)}\n      obtingut: ${JSON.stringify(a)}`);
}
export function informe(nom) {
    for (const e of errors.slice(0, 30)) console.log('  ✗ ' + e);
    if (errors.length > 30) console.log(`  … i ${errors.length - 30} més`);
    console.log(errors.length ? `✗ ${nom}: ${errors.length} errors (${oks} correctes)` : `✓ ${nom}: ${oks} comprovacions`);
    if (errors.length) process.exitCode = 1;
}
