# Localitza l'errada — `step-quiz/errades`

Static site (HTML, CSS, ES modules; no build, no server, no third-party requests). Published by Cloudflare
Pages on every commit to `main`. Student-facing text is Catalan; this file is for an AI or a developer.

A fictitious pupil («la Marta», «en Pau»…) solves an exercise in a squared-paper notebook and makes an error.
The real student must:

1. **find** the first line that cannot be deduced from the line above (tap it, then «Comprova»; keyboard:
   ↑/↓ or 1–9, Enter, Esc);
2. **explain** it («Per què és una errada?», 3 options);
3. **fix** it («Com hauria de quedar la línia?», 3 options).

Status: **stage 1 of 7** (see [`docs/STATE.md`](docs/STATE.md)). One activity: first-degree equations,
levels 1–2, one announced error per example.

## Files

| Path | Role |
|---|---|
| `index.html`, `js/index.js`, `css/index.css` | Index and link generator for teachers. `enllac()` is pure (tested). |
| `equacions.html`, `js/equacions/pagina.js` | The first-degree equations activity (reads the URL, loads `data/errors.json`, starts a session). |
| `js/equacions/generador.js` | **Pure, seeded generator** of erroneous examples (exact rationals, the pupil's procedure, mal-rules, all texts, `valida()`). |
| `data/errors.json` | Error taxonomy: name, description and the generic «Per què?» option of each type. Keys = `REGLES`. |
| `js/motor/estat.js` | Pure state machine of one example (select, check, attempts ladder, phases, points). |
| `js/motor/llibreta.js` | DOM: draws the notebook, handles mouse, touch and keyboard. |
| `js/motor/sessio.js` | A session of N examples: progress line, «Següent» band, final screen with the mark. |
| `css/tokens.css` | Colours with meaning (two layers, R1) and the self-hosted fonts. |
| `css/pagina.css`, `css/llibreta.css` | Page structure and buttons; the notebook. |
| `js/comu/punts.js`, `js/comu/seguent.js`, `css/seguent.css`, `LICENSE`, `LLICENCIA.md` | **Shared files** from `step-quiz/step-quiz-commons` (`comuns.json`, web `errades`). Never edit here. |
| `vendor/fonts/` | Kalam (OFL 1.1) and Permanent Marker (Apache 2.0), latin subsets, with their licences. |
| `tests/` | Node tests (`run-all.js`) and a Playwright smoke test (`navegador/prova.mjs`). |
| `docs/SPEC.md`, `docs/STATE.md` | Specification and living state. `docs/workflows/` holds copies of the GitHub workflows. |
| `_headers` | Cloudflare Pages cache headers. |
| `package.json` | Only `"type": "module"` so that Node reads `js/` as ES modules in the tests. No dependencies. |

## URL parameters (`equacions.html`)

| Parameter | Values | Default | Meaning |
|---|---|---|---|
| `nivell` | 1, 2 | 1 | 1: `ax + b = c` / `ax + b = dx + e`, 4–5 lines. 2: with brackets, 6–8 lines. |
| `totaloperations` | 1–20 | 6 | Examples per session. |
| `maxintents` | 1–5 | 3 | Attempts per example: 1st miss explains the tapped line, 2nd adds the direction, the last one shows the error (0 points). |
| `llavor` | integer ≥ 0 | random | Seed: the same seed gives the same examples (for testing and, later, fixed sessions). |

Points per example: 10, minus 2 per correct line marked as wrong, floor 0; 0 if the error had to be shown
(`puntsAmbErrors` of the shared `punts.js`). Final mark out of 10. No verification code yet (stage 3).

## How the generator works

1. A statement for the level (integer solution 75–80 % of the time, otherwise an irreducible fraction).
2. The pupil's procedure, one operation per line, only when it changes something: `exp` (remove brackets),
   `red1` (add like terms on each side), `tra` (x terms left, numbers right), `red2` (`ax = b`), `div`
   (`x = b/a` written as a fraction), `simp` (simplify).
3. One step is replaced by a **mal-rule** applied to the previous line; every later line is recomputed
   correctly from the wrong one. A wrong line must have a different solution from the line above.
4. Texts: the explanation of the error, the correct line, 3 «Per què?» options (the right type and two types
   of other operations, generic wording from `data/errors.json`), 3 «Corregeix-la» options (the correct line
   and two wrong ones from other rules or a retouched number/sign), and why each correct line is correct.
5. `valida()` checks every condition (each unmarked line is equivalent to the one above, each marked one is
   not, last line is `x = value`, numbers in range, options well formed, no `undefined`/`NaN`); the generator
   only returns examples that pass.

Mal-rules (`REGLES`):

| id | Step | Wrong line |
|---|---|---|
| `DISTRIBUTIVA` | exp | `2·(x + 4) → 2x + 4` |
| `DIST_SIGNE` | exp | `−2·(x − 3) → −2x − 6` |
| `SIGNE_TRANSPOSAR` | tra | `3x − 6 = x + 4 → 3x − x = 4 − 6` |
| `TERMES_NO_SEMBLANTS` | tra | `2x + 6 = x + 10 → 8x = x + 10` |
| `CALCUL` | red1, red2 | `2x + 7x = 13 − 4 → 9x = 8` |
| `OPERACIO_INVERSA` | div | `2x = −2 → x = −4` |
| `DIVISIO_SIGNE` | div | `−3x = 9 → x = 9/3` |
| `QUOCIENT_INVERTIT` | div | `2x = 16 → x = 2/16` |

At level 1 there are no brackets, so `DISTRIBUTIVA` and `DIST_SIGNE` only appear at level 2.

## Tests

```
node tests/run-all.js                 # generator (thousands of seeds), state machine, link generator, docs vs code
npm install --no-save playwright      # once, for the browser test
node tests/navegador/prova.mjs        # serves the folder, plays examples by tap and by keyboard at 1366×768 and 360×740
```

The GitHub workflow `tests.yml` (copy in `docs/workflows/`) runs `node tests/run-all.js` on every push.
