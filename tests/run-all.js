// tests/run-all.js — passa totes les proves de Node (node tests/run-all.js).
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const dir = path.dirname(fileURLToPath(import.meta.url));
let fallen = 0;
for (const f of ['generador.test.js', 'frases.test.js', 'estat.test.js', 'nivells.test.js', 'escriure.test.js', 'llac.test.js', 'banc.test.js', 'prioritat.test.js', 'index.test.js', 'docs.test.js']) {
    try {
        process.stdout.write(execFileSync(process.execPath, [path.join(dir, f)], { encoding: 'utf8' }));
    } catch (e) {
        process.stdout.write(e.stdout || '');
        process.stderr.write(e.stderr || '');
        fallen++;
    }
}
console.log(fallen ? `\n✗ ${fallen} fitxers de proves fallen` : '\n✓ Totes les proves correctes');
process.exit(fallen ? 1 : 0);
