# Localitza l'errada — `step-quiz/errades`

Static site (HTML, CSS, ES modules; no build, no server, no third-party requests). Published by Cloudflare
Pages on every commit to `main`. Student-facing text is Catalan; this file is for an AI or a developer.

A fictitious pupil («la Marta», «en Pau»…) solves an exercise in a squared-paper notebook and makes an error.
The real student must:

1. **find** the first line that cannot be deduced from the line above (tap it — or circle it with the finger, R3 —
   then «Comprova»; keyboard:
   ↑/↓ or the line number 1–9, Enter, Esc). «Comprova» appears only next to the selected line, on its left. Lines are numbered 0, 1, 2…: line 0 is the statement and cannot
   be selected (not-allowed cursor). A circled number means «the error can still be here»: line 0 and the lines
   already checked have no circle;
2. **explain** it («Per què és una errada?», 4 sentences about that very line: one true, three false);
3. **fix** it («Com hauria de quedar la línia?», 3 options).

Status: stages 1, 2 and 5 (lasso) and the order-of-operations part of stage 7 done (see
[`docs/STATE.md`](docs/STATE.md)). Two activities with the same engine and the same levels 1–5 (one or two
errors, announced or not, compensating pairs, error-free examples with `noerrors=1`, a term phase at levels 4–5):
**first-degree equations** (`equacions.html`, plus a curated bank `data/banc.json`) and **order of operations**
(`prioritat.html`, generated only). The index (`index.html`) chooses the activity and every URL parameter.

## Files

| Path | Role |
|---|---|
| `index.html`, `js/index.js`, `css/index.css` | Index and link generator for teachers: one narrow panel of «label | select» rows (like `operacions`). Activity (`pagina()`; the other rows stay hidden until one is chosen), level (short labels, `NIVELLS`; only level 2 depends on the activity), examples (1–10), attempts (1–5), «Repartiment» (different per pupil / same for everyone → `llavorNova()` seed), gesture, `noerrors`, `escriu`. `enllac()` is pure (tested; the test also reads the link back with `llegeixParametres`). |
| `css/peu.css`, `vendor/img/cc-by-nc-sa.svg`, `icon.png` | Index only: floating footer pill (author, school, licences; same look as `operacions`), self-hosted CC badge (a redraw: no third-party requests), and the sneaker logo that links to `https://step-quiz.net/`. |
| `js/motor/parametres.js` | URL parameters shared by both activities (`llegeixParametres`, `encerclaDe`, `esTactil`, `llavorNova`). |
| `prioritat.html`, `js/prioritat/pagina.js` | The order-of-operations activity (no bank). `exempleSessio()` is pure (tested). Levels reuse `js/equacions/nivells.js` (`forma` 1 = level 1, 2 = levels 2–5). |
| `js/prioritat/generador.js` | **Pure, seeded generator** of order-of-operations examples (expression lists, the pupil's procedure, mal-rules, texts, `valida()`). |
| `data/errors-prioritat.json` | Order-of-operations taxonomy. Keys = its `REGLES`. |
| `js/motor/llac.js` | Pure lasso geometry (R3): `avalua(points, lines)` → `{ linia, termes }` or `{ torna }`. |
| `equacions.html`, `js/equacions/pagina.js` | The first-degree equations activity (reads the URL, loads `data/errors.json` and `data/banc.json`, starts a session). `exempleSessio()` is pure (tested). |
| `js/equacions/nivells.js` | What each level means (`parametres`: statement type, number of errors, compensating pairs, announced or not, term phase) and which bank examples fit a level (`encaixaBanc`). Pure. |
| `data/banc.json` | Curated examples approved by David (R6), in `perPagina()` format, each with `banc: "lot1-B05"` (batch and card id of the review artifact); about 1 example in 3 comes from here when one fits the level. `tests/banc.test.js` checks their structure. |
| `js/equacions/generador.js` | **Pure, seeded generator** of erroneous examples (exact rationals, the pupil's procedure, mal-rules, all texts, `valida()`). |
| `data/errors.json` | Error taxonomy: name and description of each type. Keys = `REGLES`. |
| `js/motor/estat.js` | Pure state machine of one example (select, check, attempts ladder, term phase, «Per què?», «Corregeix-la» by choice or typing, points). |
| `js/motor/escriure.js` | Pure: is a correction typeable (`escrivible`), reading what the student typed (`llegeix`), comparing values (`correcte`). |
| `js/motor/llibreta.js` | DOM: draws the notebook, handles mouse, touch, lasso strokes and keyboard; texts per activity (`cfg.activitat`, `TEXTOS`); `parts()` splits a line («A = B», «= expr» or a statement without «=»); `^n` is drawn as an exponent. `alinea()` gives every line the widest member width (`--ma`, `--mb`) so «=» stays on one vertical even when a line overflows. |
| `js/motor/sessio.js` | A session of N examples: progress line, «Següent» band, final screen with the mark. |
| `css/tokens.css` | Colours with meaning (two layers, R1) and the self-hosted fonts. |
| `css/pagina.css`, `css/llibreta.css` | Page structure and buttons; the notebook. |
| `js/comu/punts.js`, `js/comu/seguent.js`, `css/seguent.css`, `LICENSE`, `LLICENCIA.md` | **Shared files** from `step-quiz/step-quiz-commons` (`comuns.json`, web `errades`). Never edit here. |
| `banc-errors.html`, `eines/banc-errors.mjs`, `eines/banc-errors.plantilla.html` | **Teachers' review page** (for David's department): one example per error type of both activities, numbered 1…N (equations first, in `data/errors.json` order, then order of operations), each with the error circled, the correct line and the explanation; buttons «M'agrada molt / M'agrada / No m'agrada» and an optional comment, kept in `localStorage` (`banc-errors-v1`). The fixed top bar's «Copia codi amb les preferències» copies a plain-text code (`BANC-ERRORS v1`, a legend line, one line per example `n MM|M|N|- [ \| comment]`, `FI`) that teachers email to David. No name field (removed by David). After a successful copy the button turns green and reads «Codi copiat» for 5 s. Self-contained (data, CSS, JS and the two fonts in base64). **Generated, never edit by hand:** `node eines/banc-errors.mjs` (equations: the shortest single-error bank example of each type, else the generator; order of operations: the generator). Bump `VERSIO` in the script whenever the set of examples changes, so codes say which version they answer. |
| `vendor/fonts/` | Kalam (OFL 1.1) and Permanent Marker (Apache 2.0), latin subsets, with their licences. |
| `tests/` | Node tests (`run-all.js`) and a Playwright smoke test (`navegador/prova.mjs`). |
| `docs/SPEC.md`, `docs/STATE.md` | Specification and living state. `docs/workflows/` holds copies of the GitHub workflows. |
| `_headers` | Cloudflare Pages cache headers. |
| `package.json` | Only `"type": "module"` so that Node reads `js/` as ES modules in the tests. No dependencies. |

## URL parameters (`equacions.html` and `prioritat.html`)

| Parameter | Values | Default | Meaning |
|---|---|---|---|
| `nivell` | 1–5 | 1 | 1: one error, no brackets (4–6 lines). 2: one error, brackets (6–8 lines). 3: one error, count not announced. 4: two errors, announced, ≈30 % compensating; term phase. 5: one or two, not announced, ≈30 % of the two-error ones compensating; term phase. |
| `escriu` | 0, 1 | 0 | 1: in «Corregeix-la» the student types the circled term, corrected (on-page keypad: digits, x, +, −, /), instead of choosing the line. Any writing with the same value is accepted (10/2 = 5). Errors that change the line's structure (`TERMES_NO_SEMBLANTS`) still use the 3 options. |
| `encercla` | 0, 1 | (absent = auto) | R3. 1: the student circles the line with the finger or by dragging the mouse (a short tap still selects); 0: tap only; absent: circle on touch screens (`pointer: coarse`), tap with a mouse. |
| `noerrors` | 0, 1 | 0 | 1: at every level ≈1 example in 5 has no error, and the count is never announced (button «No hi ha cap errada» / «No n'hi ha cap més»). |
| `totaloperations` | 1–20 | 6 | Examples per session. |
| `maxintents` | 1–5 | 3 | Attempts per example: 1st miss explains the tapped line, 2nd adds the direction, the last one shows the error (0 points). |
| `llavor` | integer ≥ 0 | random | Seed: the same seed gives the same examples (the index offers it as the select «Repartiment: Iguals per a tothom»; it generates the seed, there is no free seed field). |

## Lasso (R3)

On `.linies`, a pointer stroke longer than 8 px becomes a lasso (`touch-action: none` on the notebook while
searching, so the finger draws instead of scrolling; shorter strokes are ordinary taps). `llac.avalua`: closed
stroke → the terms whose centre is inside the polygon; terms of one line → that line, and 1–2 enclosed terms are
remembered; terms of several lines, too small, or no clear line → «Torna a marcar-ho, si us plau: …» (`llacDubtos`).
An open stroke (underline) or a closed one with no term inside picks the line it covers vertically. The stroke stays
drawn (dashed, black) until «Comprova». On a hit (`comprova`): if a remembered term is a wrong term, «I has encerclat
just el terme equivocat» and the term phase is skipped; if not, the term phase runs as usual (levels 4–5).

## Order of operations (`js/prioritat/generador.js`)

Expression `E = [{ o, x }]` (`o` null / `+` / `−` / `·` / `:`; `x` an integer, a bracket without brackets or
powers inside, or a power `b^e`). Lines: the statement without «=», then «= …». The pupil's procedure does one
level per line: brackets (each advances one step, all at once; a bracket that is a number disappears) → all powers →
the first operation of every `·`/`:` chain → the first `+`/`−` (left to right). An error = a line whose value
differs from the line above. Level 1: naturals, `+ − · :`, ≤ 5 numbers, no negatives anywhere (4–6 lines). Levels
2–5: brackets, powers, some negative numbers (written «(−3)» after an operator), ≤ 6 numbers, ≤ 2 brackets/powers
(5–8 lines, one more with two errors). Statements never repeat a number (David, batch 2, C11). Exact divisions only.

| id | Wrong step | Source |
|---|---|---|
| `ESQUERRA_DRETA` | `6 + 5 · 2 → 11 · 2` (a `+`/`−` done before a `·`/`:` because it comes first; also inside brackets) | Tabak (2019): ≈80 % of 240 pupils; Bye et al. (2024) |
| `SUMA_ABANS_RESTA` | `10 − 3 + 2 → 10 − 5` | the «literal» reading of the acronym (University of Portsmouth study) |
| `PRODUCTE_ABANS_DIVISIO` | `24 : 2 · 3 → 24 : 6` | same |
| `PARENTESI_IGNORAT` | `2 · (11 − 1) → 22 − 1` | classic; no source read |
| `POTENCIA_PER_EXPONENT` | `3^2 → 6` (every power of the step: `2·3^2 + 5^2 → 2·6 + 10`) | classic; no source read |
| `POTENCIA_DESPRES` | `2 · 3^2 → 6^2` | classic; no source read |
| `RESTA_NEGATIVA` | `15 − 27 → 12` (two positive numbers, the second larger) | parallels `CALCUL` («signe») of the equations |
| `SIGNE_PRODUCTE` | `(−8) · 8 → 64` | parallels the sign errors in Gasa and Erbaş et al. |

Weights `pes`: 5, 3, 2, 3, 4, 3, 2, 2. «Corregeix-la» distractors: other rules' lines for the same step, then
`retoca()` (one result of the correct step computed with another operation, never 0 or invented negatives).

Points per example: 10, minus 2 per correct line marked as wrong, floor 0; 0 if the error had to be shown
(`puntsAmbErrors` of the shared `punts.js`). Final mark out of 10. No verification code yet (stage 3).

## How the generator works

1. A statement for the level (integer solution 75–80 % of the time, otherwise an irreducible fraction).
2. The pupil's procedure, one operation per line, only when it changes something: `exp` (remove brackets),
   `red1` (add like terms on each side), `tra` (x terms left, numbers right), `red2` (`ax = b`), `div`
   (`x = b/a` written as a fraction), `simp` (simplify).
3. One step is replaced by a **mal-rule** applied to the previous line; every later line is recomputed
   correctly from the wrong one. A wrong line must have a different solution from the line above.
4. Texts: the explanation of the error (never the correct line: it comes before «Corregeix-la»), 4 «Per què?»
   sentences built from the line's own numbers (`PERQUE`: one true, three plausible false ones, e.g. «Ha decidit
   fer $−45 − 9$, però hauria d'haver fet {−45|9}» / «Ha decidit fer una resta, però havia de fer una suma» /
   «Havia de fer $−45 − 9$, però el resultat és $+54$» / «El resultat és $945$»), 3 «Corregeix-la» options (the
   correct line and two wrong ones), and, for each correct line, «En aquesta línia no s'ha comès cap errada: és
   correcte haver escrit …» listing what was newly written in it.
5. `valida()` checks every condition (each unmarked line is equivalent to the one above, each marked one is
   not, last line is `x = value`, numbers in range, options well formed, no `undefined`/`NaN`); the generator
   only returns examples that pass.

Mal-rules (`REGLES`):

| id | Step | Wrong line |
|---|---|---|
| `DISTRIBUTIVA` | exp | `2·(x + 4) → 2x + 4` |
| `DIST_SIGNE` | exp | `−2·(x − 3) → −2x − 6` |
| `SUMA_ABANS_PRODUCTE` | exp | `3 + 2·(x − 4) = 3x − 2 → 5·(x − 4) = 3x − 2` (65 %) or `→ 5x − 4 = 3x − 2` (adds the number before the bracket to its factor; only `a + c·(…)` with a, c > 0 and a single bracket in the line; form E now has a + sign 40 % of the time so it can appear; David, teachers' review page v1, item 13) |
| `DIST_SUMA` | exp | `x − 2·(3x + 6) = 3x + 7 → x − 5x − 12 = 3x + 7` (outer factor added to the inner x-coefficient: sign(c)·(\|c\| + m); only for `c·(mx + b)` with m ≥ 2, \|c\| ≥ 2; David's real error) |
| `SIGNE_TRANSPOSAR` | tra | `3x − 6 = x + 4 → 3x − x = 4 − 6`; 35 % of the time when ≥ 2 terms move, all keep their sign: `5x + 3 = 2x + 9 → 5x + 2x = 9 + 3` (Erbaş YK26). Errors with two wrong terms store `termes: [i, j]`; the term phase accepts either |
| `SIGNE_COPIAT` | exp, red1, tra (30 %: two terms when possible) | `9x + 7 = 3x − 23 → 9x − 3x = 23 − 7` (a term that is only copied in this step loses or gains a visible minus; never the leading positive term, whose sign is not written) |
| `TERMES_NO_SEMBLANTS` | tra, red1 | tra: `2x + 6 = x + 10 → 8x = x + 10`; red1: `2x + 3 + 4x = 18 → 9x = 18` (side with ≥ 2 x-terms and ≥ 1 number, all numbers \|n\| ≤ 15) |
| `COEFICIENT_U` | red1, red2 | `3x + x + 6x = 4 − 2x → 9x = 4 − 2x`; `5x − x = 9 − 1 → 5x = 8` (a lone ±x is not counted; David's real error) |
| `CALCUL` | red1, red2 | `8x + 4x = −3 + 15 → 12x = −12` (sign of the result) or `→ 12x = −18` (adds the absolute values of opposite-sign terms); `−3 − 15 → +18` or `→ −12`. Only two-term sums with at least one negative term (David, bank batch 1, B07) |
| `OPERACIO_INVERSA` | div | `3x = 12 → x = 9` (B − A), `x = −9` (A − B, likelier when \|A\| > \|B\|), `x = 36` (A·B), `x = 15` (A + B) (Erbaş et al. 2009, YK06/YK03/YK05) |
| `COEFICIENT_OBLIDAT` | div | `3x = 12 → x = 12` (Erbaş et al. 2009, YK01) |
| `DIVISIO_SIGNE` | div | `−3x = 9 → x = 9/3` |
| `QUOCIENT_INVERTIT` | div | `2x = 16 → x = 2/16`; the «twin» case `12x = 3 → x = 12/3` (pupil thinks 3 : 12 is impossible) gets its own explanation when \|A\| > \|B\| (David, review page v1, item 12) |
| `INVERS_X` | inv | `30/x = 5 → x = 30·5` (correct: `5x = 30`). New term kind `I(a)` = a/x (only with numbers around it; `solucio` handles it), product term `M(a, b)` = a·b (simplified by `simp`), new op `inv` (a/x = B → Bx = a); level-1 form I `a/x + c = d` (David, 26/11/2026) |
| `CANVI_SIGNE_PARCIAL` | neg | `−4x + 5 − 3x = 6 − x → 4x − 5 + 3x = 6 + x` or `→ 4x + 5 + 3x = −6 + x`: one term keeps its sign. New op `neg` (all signs changed) only when the left side starts with x-terms that are all negative and the right side has an x-term; level-2 form K `−ax + b − cx = d − ex` (David) |
| `DENOMINADORS` | den | `(3x + 5)/2 − (x − 4)/3 = 5x → 9x + 15 − 2x − 8 = 30x` (variant `signe`: the − before a fraction does not change the numerator's second term) or `→ 9x + 15 − 2x + 8 = 5x` (variant `sense`: terms without a denominator not multiplied). New term kind `D(s, m, b, den)` = s·(mx + b)/den, new op `den` (multiply by the lcm, expanded directly); level-2 form L (David) |

Lines containing the new kinds (`i`, `d`, `m`) only accept the three new rules (`NOVES` in `candidates`). With a fixed statement (`e0`) neither line-count limits nor number margins apply. `OPS` is now `den, exp, neg, red1, tra, red2, inv, div, simp`.
