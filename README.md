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
errors, announced or not, compensating pairs, error-free examples with `noerrors=1`, a term phase at every level):
**first-degree equations** (`equacions.html`, plus a curated bank `data/banc.json`) and **order of operations**
(`prioritat.html`, generated only). The index (`index.html`) chooses the activity and every URL parameter.

## Files

| Path | Role |
|---|---|
| `index.html`, `js/index.js`, `css/index.css` | Index and link generator for teachers: one narrow panel of «label | select» rows (like `operacions`). Activity (`pagina()`; the other rows stay hidden until one is chosen), level (short labels, `NIVELLS`; only level 2 depends on the activity), examples (1–10), attempts (1–5), «Repartiment» (different per pupil / same for everyone → `llavorNova()` seed), gesture, `noerrors`, `escriu`, «Paraula» (`membre`, equations only). `enllac()` is pure (tested; the test also reads the link back with `llegeixParametres`). |
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
| `js/equacions/frases.js` | Pure: the «Per què?» sentences of David's sentence editor. Template renderer (`render`: markers, `$…$`, fractions, `\bold`, `\oposite`, `\signe`, `\nosign`, position references, `[mal]`/`[bo]`, a negative value after an operator in brackets), the situation and marker values of each rule (`situacio`), sentence choice with conditions and reserves (`perque`), and the «membre» word (`posaParaula`, `exempleAmbParaula`). |
| `js/equacions/frases-dades.js` | **Generated** by `node eines/frases-editor/exporta.mjs` (never edit by hand): sentence templates and, per situation, the true sentence, the distractors (optional `cond`) and reserves. |
| `data/errors.json` | Error taxonomy: name and description of each type. Keys = `REGLES`. |
| `js/motor/estat.js` | Pure state machine of one example (select, check, attempts ladder, term phase, «Per què?», «Corregeix-la» by choice or typing, points). |
| `js/motor/escriure.js` | Pure: is a correction typeable (`escrivible`), reading what the student typed (`llegeix`), comparing values (`correcte`). |
| `js/motor/llibreta.js` | DOM: draws the notebook, handles mouse, touch, lasso strokes and keyboard; texts per activity (`cfg.activitat`, `TEXTOS`); `parts()` splits a line («A = B», «= expr» or a statement without «=»); `^n` is drawn as an exponent. `alinea()` gives every line the widest member width (`--ma`, `--mb`) so «=» stays on one vertical even when a line overflows. |
| `js/motor/sessio.js` | A session of N examples: progress line, «Següent» band, final screen with the mark. |
| `css/tokens.css` | Colours with meaning (two layers, R1) and the self-hosted fonts. |
| `css/pagina.css`, `css/llibreta.css` | Page structure and buttons; the notebook. |
| `js/comu/punts.js`, `js/comu/seguent.js`, `css/seguent.css`, `LICENSE`, `LLICENCIA.md` | **Shared files** from `step-quiz/step-quiz-commons` (`comuns.json`, web `errades`). Never edit here. |
| `HANDOUT.md` | Cold-start brief for the next AI session: what was done in the 2026-11-26 session and the open work. |
| `eines/frases-editor/` | Sources of the sentence editor. **Current artifact (28/11/2026, this account):** «Frases de «Per què és una errada?» · Equacions (editor nou)», https://claude.ai/artifact/9bXYd1w2wk9GsL1mGZj8ys, slug `459b38ba-e06d-4ebd-a5c6-0564025c1fce`, capabilities `{db:{}, user:{}}`. `dades.json` (catalogue v2, made once by `cataleg-2.mjs` from the sentences of 28/11: the source of truth; deactivated situations carry `desactivada: true` and are hidden; `reserva` lists reserve sentences), `plantilla.html` + `dades.json` → `index.html` (replace `/*DADES*/`, escape `</`); `prova*.mjs` (Playwright, mocked `window.claude`). `exporta.mjs`: `dades.json` + `editor-db.json` (the artifact's db collections `frases` and `situacions`, written by Claude) → `js/equacions/frases-dades.js`; `banc.mjs` rewrites the «Per què?» sentences of `data/banc.json`. History: the old editor (slug `1f8b92d4-…`, other account, unreadable from here) was exported by hand as `editor-2026-11-28.txt`; `cataleg.mjs`/`dades.mjs` are stale and throw. Not part of the site. |
| `banc-errors.html`, `eines/banc-errors.mjs`, `eines/banc-errors.plantilla.html` | **Teachers' review page** (for David's department): one example per error type of both activities, numbered 1…N (equations first, in `data/errors.json` order, then order of operations), each with the error circled, the correct line and the explanation; buttons «M'agrada molt / M'agrada / No m'agrada» and an optional comment, kept in `localStorage` (`banc-errors-v1`). The fixed top bar's «Copia codi amb les preferències» copies a plain-text code (`BANC-ERRORS v1`, a legend line, one line per example `n MM|M|N|- [ \| comment]`, `FI`) that teachers email to David. No name field (removed by David). After a successful copy the button turns green and reads «Codi copiat» for 5 s. Self-contained (data, CSS, JS and the two fonts in base64). **Generated, never edit by hand:** `node eines/banc-errors.mjs` (equations: the shortest single-error bank example of each type, else the generator; order of operations: the generator). Bump `VERSIO` in the script whenever the set of examples changes, so codes say which version they answer. |
| `vendor/fonts/` | Kalam (OFL 1.1) and Permanent Marker (Apache 2.0), latin subsets, with their licences. |
| `tests/` | Node tests (`run-all.js`) and a Playwright smoke test (`navegador/prova.mjs`). |
| `docs/SPEC.md`, `docs/STATE.md` | Specification and living state. `docs/workflows/` holds copies of the GitHub workflows. |
| `_headers` | Cloudflare Pages cache headers. |
| `package.json` | Only `"type": "module"` so that Node reads `js/` as ES modules in the tests. No dependencies. |

## URL parameters (`equacions.html` and `prioritat.html`)

| Parameter | Values | Default | Meaning |
|---|---|---|---|
| `nivell` | 1–5 | 1 | 1: one error, no brackets (4–6 lines). 2: one error, brackets (6–8 lines). 3: one error, count not announced. 4: two errors, announced, ≈30 % compensating. 5: one or two, not announced, ≈30 % of the two-error ones compensating. Every level asks for the wrong term after the line. |
| `escriu` | 0, 1 | 0 | 1: in «Corregeix-la» the student types the circled term, corrected (on-page keypad: digits, x, +, −, /), instead of choosing the line. Any writing with the same value is accepted (10/2 = 5). Errors that change the line's structure (`TERMES_NO_SEMBLANTS`) still use the 3 options. |
| `encercla` | 0, 1 | (absent = auto) | R3. 1: the student circles the line with the finger or by dragging the mouse (a short tap still selects); 0: tap only; absent: circle on touch screens (`pointer: coarse`), tap with a mouse. |
| `noerrors` | 0, 1 | 0 | 1: at every level ≈1 example in 5 has no error, and the count is never announced (button «No hi ha cap errada» / «No n'hi ha cap més»). |
| `totaloperations` | 1–20 | 6 | Examples per session. |
| `maxintents` | 1–5 | 3 | Attempts per example: 1st miss explains the tapped line, 2nd adds the direction, the last one shows the error (0 points). |
| `llavor` | integer ≥ 0 | random | Seed: the same seed gives the same examples (the index offers it as the select «Repartiment: Iguals per a tothom»; it generates the seed, there is no free seed field). |
| `membre` | `membre`, `costat`, `banda`, `part` | `membre` | Equations only (index row «Paraula»). The word for the two sides of the equation in the «Per què?» sentences, with gender and plural handled (`membre`, `costat` masculine; `banda`, `part` feminine): «a la banda de la dreta», «l'altra banda», «les dues bandes». |

## Lasso (R3)

On `.linies`, a pointer stroke longer than 8 px becomes a lasso (`touch-action: none` on the notebook while
searching, so the finger draws instead of scrolling; shorter strokes are ordinary taps). `llac.avalua`: closed
stroke → the terms whose centre is inside the polygon; terms of one line → that line, and 1–2 enclosed terms are
remembered; terms of several lines, too small, or no clear line → «Has de tornar a marcar-ho, perquè …» (`llacDubtos`).
An open stroke (underline) or a closed one with no term inside picks the line it covers vertically. The stroke stays
drawn (dashed, black) until «Comprova». While the finger is still down (class `.dibuixant` on the notebook) no line
looks selected or hovered and «Comprova» is hidden: the line is marked only when the finger lifts. With touch or pen
(class `.toc`) the hover grey of a line is not shown (it would stick to the touched line). On a hit (`comprova`): if a remembered term is a wrong term, «I has encerclat
«Molt bé, has localitzat la línia i el terme…» and the term phase is skipped; if only correct terms were enclosed, the line counts as
found but it is a failed attempt and the term phase runs («Has localitzat la línia correctament, però no el
terme…»). With no enclosed term (or a tap / mouse click) the term phase runs without losing points.

**Term phase (every level, David 26/11/2026).** After the line is found, its terms become buttons in place; the
student taps the wrong term (keyboard: ←/→, Enter). Each correct term chosen is a failed attempt and shares the
counter with wrong lines (`S.errors`, `maxintents`); when the attempts run out, the wrong term is circled, the
example is worth 0 and the example goes on to «Per què?».

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
| `PARENTESI_IGNORAT` | `2 · (11 − 1) → 22 − 1` | classic; no source read **Deactivated** (survey 28/11, `DESACTIVADES`). |
| `POTENCIA_PER_EXPONENT` | `3^2 → 6` (every power of the step: `2·3^2 + 5^2 → 2·6 + 10`) | classic; no source read |
| `POTENCIA_DESPRES` | `2 · 3^2 → 6^2` | classic; no source read |
| `RESTA_NEGATIVA` | `15 − 27 → 12` (two positive numbers, the second larger) | parallels `CALCUL` («signe») of the equations |
| `RESTA_GIRADA` | `3 − 8 · 5 → 40 − 3` (product done right, moved to the front, subtraction reversed; only when the product is larger than the first number and is the only product of the step) | David's pupil, 27/11/2026 |
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
   sentences built from the line's own numbers (one true, three false). They come from David's sentence editor
   (`js/equacions/frases.js`, data in `frases-dades.js`): each rule maps to a *situation* (e.g. `DIST_SIGNE` with
   `−(x + b)` → `DSIG1`, otherwise `DSIG2`; `CALCUL` → `CAL1`/`CAL2`/`CAL3` by type; `OPERACIO_INVERSA` → `OI1`
   (resta and inversa), `OI3`, `OI4`) with its marker values; a distractor whose `cond` does not hold (`exp`,
   `red1`, `tra`, `xPositiva`, `xNegativa`, `AdiferentB`) or whose marker has no value in this example
   (`[altre terme]`, `[altre càlcul]`, `[terme d'abans]`) is skipped; with fewer than 3 left, the situation's
   `reserva` fills in (an example that still has fewer is discarded by `valida()`). Bold is written `**…**` and
   drawn by `txt()` in `llibreta.js`. The «membre» markers stay in the example and the page resolves them
   (`exempleAmbParaula`, URL `membre`). The rules not yet in the editor (`SUMA_ABANS_PRODUCTE`, `INVERS_X`,
   `CANVI_SIGNE_PARCIAL`, `DENOMINADORS`) keep their sentences in `PERQUE`. 3 «Corregeix-la» options (the
   correct line and two wrong ones), and, for each correct line, «Aquesta línia és correcta, perquè és
   correcte haver escrit …» listing what was newly written in it.
5. `valida()` checks every condition (each unmarked line is equivalent to the one above, each marked one is
   not, last line is `x = value`, numbers in range, options well formed, no `undefined`/`NaN`); the generator
   only returns examples that pass.

Deactivated rules: `DESACTIVADES` (in each generator) lists rules, or `RULE:variant`, that the generator never
uses (neither as the error nor as a «Corregeix-la» option) and whose bank examples `encaixaBanc` skips. Filled after
the department survey (`docs/enquesta-banc-errors.md`, 28/11/2026): equations `DIST_SUMA`, `CANVI_SIGNE_PARCIAL`,
`SUMA_ABANS_PRODUCTE:x`; order of operations `PARENTESI_IGNORAT`. Remove an entry to bring the rule back.

Mal-rules (`REGLES`):

| id | Step | Wrong line |
|---|---|---|
| `DISTRIBUTIVA` | exp | `2·(x + 4) → 2x + 4` |
| `DIST_SIGNE` | exp | `−2·(x − 3) → −2x − 6` |
| `SUMA_ABANS_PRODUCTE` | exp | `3 + 2·(x − 4) = 3x − 2 → 5·(x − 4) = 3x − 2` (65 %) or `→ 5x − 4 = 3x − 2` (adds the number before the bracket to its factor; only `a + c·(…)` with a, c > 0 and a single bracket in the line; form E now has a + sign 40 % of the time so it can appear; David, teachers' review page v1, item 13) The `5x − 4` variant is **deactivated** (survey 28/11, `SUMA_ABANS_PRODUCTE:x`). |
| `DIST_SUMA` | exp | `x − 2·(3x + 6) = 3x + 7 → x − 5x − 12 = 3x + 7` (outer factor added to the inner x-coefficient: sign(c)·(\|c\| + m); only for `c·(mx + b)` with m ≥ 2, \|c\| ≥ 2; David's real error) **Deactivated** (survey 28/11, `DESACTIVADES`). |
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
| `CANVI_SIGNE_PARCIAL` | neg | `−4x + 5 − 3x = 6 − x → 4x − 5 + 3x = 6 + x` or `→ 4x + 5 + 3x = −6 + x`: one term keeps its sign. New op `neg` (all signs changed) only when the left side starts with x-terms that are all negative and the right side has an x-term; level-2 form K `−ax + b − cx = d − ex` (David) **Deactivated** (survey 28/11, `DESACTIVADES`). |
| `DENOMINADORS` | den | `(3x + 5)/2 − (x − 4)/3 = 5x → 9x + 15 − 2x − 8 = 30x` (variant `signe`: the − before a fraction does not change the numerator's second term) or `→ 9x + 15 − 2x + 8 = 5x` (variant `sense`: terms without a denominator not multiplied). New term kind `D(s, m, b, den)` = s·(mx + b)/den, new op `den` (multiply by the lcm, expanded directly); level-2 form L (David) |

Lines containing the new kinds (`i`, `d`, `m`) only accept the three new rules (`NOVES` in `candidates`). With a fixed statement (`e0`) neither line-count limits nor number margins apply. `OPS` is now `den, exp, neg, red1, tra, red2, inv, div, simp`.
