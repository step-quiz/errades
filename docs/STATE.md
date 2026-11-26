# Localitza l'errada — living state

Agent-facing memory between sessions. English. Update it in the same commit as any change.
Spec: [`SPEC.md`](SPEC.md). Where they disagree, this file wins.

## Status (2026-11-25)

| Stage (SPEC §9) | Status |
|---|---|
| 1 Skeleton, taxonomy, generator + tests, notebook page (tap + «Comprova», keyboard, F1/F3, «Per què?», «Corregeix-la» by choice, points) | **DONE** — tested and accepted by David after six rounds of corrections |
| 2 Five levels, two errors, compensating pairs, `noerrors`, typed correction, curated bank (R6), term phase (R4) | **DONE** (ZIP «etapa2»); bank: batch 1 → 20 (ZIP «banc1»), batch 2 → 11 (ZIP «banc2»), batch 3 → 8 (ZIP «banc3»): 39 examples |
| 3 Verification code `LE` + analyser in `operacions` | PENDING |
| 4 Projector mode | PENDING |
| 5 Lasso (R3) | **DONE** (ZIP «llac-prioritat»), before 3 and 4 at David's request |
| 6 «Caça l'errada del solucionari» in `step-quiz/sol` | PENDING |
| 7 Fractions, then order of operations | Order of operations **DONE** (ZIP «llac-prioritat»); fractions PENDING |

## Decisions taken while building stage 1 (agent; tell David if any matters)

- **Own pupil procedure, not the `operacions` engine.** `operacions/js/equacions/math-engine.js` moves a term
  and simplifies in the same step (`group_x`), so it never writes the line where the classic sign error lives
  (`3x − x = 4 − 6`). `generador.js` writes one line per operation, like a pupil: exp, red1, tra, red2, div
  (`x = 15/3`), simp (`x = 5`).
- **Shared files through `step-quiz-commons`**, as David suggested in R7: commons got `fitxers/esm/punts.js`,
  `fitxers/esm/seguent.js` (ES modules, with `fitxers/esm/package.json` `"type": "module"` so Node can import
  them in commons' tests) and `fitxers/seguent.css`, plus the `errades` entry in `comuns.json` (ZIP for
  commons delivered together with ZIP 1). Commons' «Sintaxi» CI step only checks `fitxers/*.js`, so the
  modules in `fitxers/esm/` are checked by `tests/prova.mjs` instead.
- **Operacions keeps its own copies** of those three files for now. David (2026-11-25): make operacions
  receive them from commons **later**, once stage 1 of errades works. Until then, a change to one of them must
  be made in both places (commons and operacions).
- **Colours for the shared «Següent» band:** `css/tokens.css` maps `--success` → lilac (right) and `--danger` →
  grey (wrong), so the common band follows R1 without touching the shared CSS. Its title is «Molt bé!» or
  «T'he ensenyat l'errada» (0 points).
- **Fonts self-hosted** (latin subsets from @fontsource 5.3.0): Kalam 400/700 (OFL 1.1), Permanent Marker 400
  (Apache 2.0); both cover Catalan letters and U+2212 (−). ✓ and ✗ fall back to a system font.
- **Seeds:** `llavor` in the URL makes a session reproducible (example i uses `llavor + 7919·i`). Fixed
  sessions (`?fixed=`) are not implemented yet.
- **Level 1 has no brackets**, so `DISTRIBUTIVA` and `DIST_SIGNE` only appear at level 2. `DIVISIO_SIGNE` is
  rare at level 1 (it needs a negative coefficient after reducing). Rule weights: `pes` in `REGLES`.
- **«Per què?»: 4 sentences about that very line** (`PERQUE` in `generador.js`), one true and three plausible
  false ones, all built from the line's numbers (David's model, 2026-11-25; it replaced the first, generic
  options). Every false sentence is false for any example of its rule (checked by hand when written); CALCUL's
  «only the sign is wrong» is offered only when it is false.
- `package.json` exists only for `"type": "module"` (Node tests). Cloudflare Pages must have no build command.

## Corrections after David's first test (2026-11-25, ZIP 2)

1. **No explanation gives the answer away.** `expl` of every mal-rule says *why* it is wrong, never the correct
   line or value (it is shown before «Corregeix-la»). `valida()` rejects an `expl` that contains `bona` or its
   right-hand side.
2. **The wrong line is crossed out diagonally**, one stroke per member: a horizontal line-through hid the «−» signs.
3. **The teacher's correction is aligned at «=»**: it is a `.corr.ex` in the same grid column as the lines.
4. **Lines that come from a corrected error** (after it, once no error is pending) are faded to 40 % inside a big
   red parenthesis labelled «Ve d'una errada: no té sentit». This **replaces E4 = No** (David asked for it).
5. **The statement (line 1) can no longer be selected** (`seleccionable` needs i ≥ 1).
6. **The message goes before the phase question** («Sí! L'errada és aquí.» then «Per què és una errada?»), and the
   page scrolls so both are visible.

## Second round of corrections (2026-11-25, ZIP 3)

1. The instruction sentence is in print font (UI font), not handwriting.
2. Lines numbered 0, 1, 2…; line 0 = statement: no circle, `cursor: not-allowed`, keyboard 0 ignored.
3. Checked lines (and the found error) lose the circle around their number: circled = still a candidate.
4. F1 text: «En aquesta línia no s'ha comès cap errada:» + line break + «és correcte haver escrit X i també és
   correcte haver escrit Y.» (X, Y = what was newly written, as it appears in the line). David wrote «+8» in his
   example for `2x + 8 = −7x − 37 → 2x + 7x = −37 − 8`; the line shows «−8», so the text says «−8».
   No «No és aquí.» any more; the direction hint (2nd miss) goes on a new line.
5. Selecting another line clears the previous message.
6. «Per què?» = 4 specific sentences (see above).

## Third round of corrections (2026-11-25, ZIP 4)

1. No «Comprova» button until a line is selected; then it appears **just left of that line** (a 7.5rem gutter
   column in every `.fila`; below 560 px the button goes under the selected line).
2. Messages go **right under the line they talk about** (`S.msgLinia`); in a phase, the question follows the
   message there. So the previous line, the wrong line, the message and the 4 options are one block, and
   `fesVisible()` scrolls so the whole block is on screen (if it cannot fit, its top). All the other lines are
   faded while a phase is open.
3. Fading is **25 %** (David asked to change it from 40 %), for the phase and for the lines that come from a
   corrected error.
4. Those lines sit between **two big black parentheses** «(» «)»; no text label any more.

5. Only the **side that is wrong** is crossed out (`.ratlla`, set by comparing each side with the correct line);
   a side that was right stays as it is (David: «per quin motiu tatxes −9x + 10? aquesta part estava bé!»).

## Fourth round (2026-11-25, ZIP 5)

1. Instruction in two rows: «La Noa ha resolt aquesta equació i ha comès una errada.» + chips «Errades: 1»
   «Localitzades: 0» on the right; second row «Toca la primera línia…». Without an announced count, only
   «Localitzades».
2. No «Punts» chip in the notebook (the session total stays in the top bar) and no «enunciat» tag.
3. Softer blue: top bar and index header `--blau-suau` (#e3e9fb) with dark text; `.b.pri` (Comprova and the
   other main buttons) = blue border, white background, blue text; focus ring #8fa3e8. The shared «Següent»
   button keeps the shared CSS, now with `--primary` = `--blau` (#2f45b8).

## Fifth round (2026-11-25, ZIP 6)

1. Hover rule now uses an **inset** shadow: the outer one was clipped on the left of «Comprova» (the `.linies`
   container scrolls horizontally, so it clips anything outside it).
2. At the end of an example, every correct line before the first error gets the pencil ✓.
3. The statement (line 0) is in print (serif, black): the pupil did not write it. Same grid, so «=» stays aligned.

## Stage 2 (2026-11-25)

- **Levels** (`js/equacions/nivells.js`, pure, tested): 1 one error no brackets; 2 one error brackets; 3 one error,
  not announced; 4 two errors announced (≈30 % compensating) + term phase; 5 one or two, not announced (≈30 % of
  the two-error ones compensating) + term phase. `noerrors=1`: ≈1 in 5 error-free at every level and the count is
  never announced (R5). Statements: level 1 uses the simple forms, 2–5 the bracket forms.
- **Term phase** (R4, levels 4–5): after the line is found, its terms become buttons in place (no zoom), the line
  above is lightly shaded; a correct term → «Per què?»; a wrong term → message, no points lost; the second wrong
  term reveals it (circled). Keyboard: ←/→ and Enter. The red circle only appears once the term is found.
- **Two errors**: after the first is corrected, «Encara en queda una»; nothing is faded until all are found. At the
  end the bracketed group starts after the first error; a second error inside it stays at full opacity.
- **Bracketed group** has no padding of its own (padding made its lines narrower and broke the «=» alignment); the
  parentheses sit in the notebook's margin. On phones the teacher's correction is 17 px so that a member does not
  exceed half the width (else «=» would shift).
- **Bank (R6)**: `data/banc.json` (`{"exemples": [...]}`, `perPagina()` format). `exempleSessio()` takes ≈1 in 3
  from the bank when an example fits the level (`encaixaBanc`: error count and brackets). Batch 1 (21 candidates,
  small numbers, two per error type + two-error + compensating + error-free) is in the review artifact
  «Banc d'errades, lot 1» (https://claude.ai/artifact/KUf6CzSQsc95SgjKsMJzSn, slug
  95a10d23-a842-4bb3-b7f2-d0882ea62883; decisions in db collection `banc`, David's real errors in `reals/notes`,
  Claude's replies in `rep`). Approved ones go to `data/banc.json` after «Revisa artifact».
- **Typed correction** (E3; David chose: type only the circled term; the teacher decides with `escriu=1`, checkbox in
  the index): `js/motor/escriure.js` (pure). Only when the wrong and correct lines differ in exactly the circled term
  (`fitxesBona` from the generator); otherwise the 3 options. Same value accepted (5 = 10/2 = 15/3; 9/−3 = −3). First
  wrong attempt: «Torna-ho a provar»; second: the term and the line are shown. No points. Own keypad (digits, x, +,
  −, /, ⌫), not `operacions/js/teclat.js` (it has no x, + or /); on touch devices the input has `inputmode="none"`.
  The bank batch was regenerated with `fitxesBona` (same 21 examples, deterministic).
- `pagina.js` only starts a session on `equacions.html` and only once (`window.__erradesEngegat`), so the browser
  test can import it to compute the same examples.

## Bank batch 1 reviewed (2026-11-25, ZIP «banc1»)

- **20 of 21 approved** → `data/banc.json` with `banc: "lot1-Bxx"` (B07 not approved). `tests/banc.test.js` checks
  every bank example (one «=» per line, texts for every correct line, 4/3 options, typed term readable, `expl` does
  not contain the correct line, fits some level). Replies to every card are in the batch-1 artifact (`rep/Bxx`).
- **David's comments turned into generator changes:**
  - B07 (`−3 + 15 → 10` is not a pupil error; −12 or −18 are): `CALCUL` rewritten. Only two-term sums with at least
    one negative term; wrong value = −S («signe») or, with opposite signs, sign(v1)·(|v1|+|v2|) («suma»), with equal
    signs sign(v1)·||v1|−|v2|| («resta»). Never S or 0. One specific true sentence per kind. B08 (`15 − 11 → 6`)
    was approved anyway and stays in the bank; the generator would now write −4 or 26.
  - B05, B15 (signs miscopied): new rule `SIGNE_COPIAT` (exp, red1, tra; pes 2). `copiats(op, l, bo)` lists the terms
    of the correct line that are only copied in that step; one of them changes sign. Never the leading positive term
    (its sign is not written). One sign per error (David's B15 example flips two; that would give the term phase two
    right answers — asked in the reply, not done).
  - B16 (`2x + 3 + 4x = 18 → 9x = 18`): `TERMES_NO_SEMBLANTS` also at red1 (a side with ≥ 2 x-terms and ≥ 1 number,
    numbers |n| ≤ 15, merged into one x-term; data `tres: true`). New level-1 statement form G `ax + b + cx = e`
    (`tria(['A','A','B','G'])`), so level 1 is now 4–6 lines (`LIMITS[1] = [4, 6]`).
  - B09 (`x = 2/10`): already `QUOCIENT_INVERTIT`, and it is one of the wrong options of that very card. No change.
- `valida()` now rejects an `expl` containing `$<right side of bona>$` (a whole formula); the old substring test
  wrongly matched `$−12$` against `12$`.
- **Bank tooling:** `generaExemple` accepts `e0` (fixed statement built with the exported `T.linia/X/N/P`) and
  `filtre(c)`; batch 2 was built with it (script kept outside the repo; the README shows the pattern).
- **«=» alignment on narrow screens:** `alinea()` in `llibreta.js` sets `--ma`/`--mb` on `.linies` to the widest left
  and right member (re-run after every `pinta()`, on resize and on `document.fonts.ready`); the «=» column is a fixed
  1.6rem with the «=» centred and the gap is in rem, so the print, pupil and teacher fonts (different «=» widths and
  sizes) share one vertical. Found by the browser test at 360 px once a longer level-4 example came up.
- The browser test now computes the examples with `exempleSessio()` and the real bank (it used to assume the
  generator), and checks the «=» of the corrections too.
- **Batch 2** «Banc d'errades, lot 2» (https://claude.ai/artifact/KgzZM2mQo9bho8g5h4FizT, slug
  9759f95d-eda9-44f9-85e1-f767c3ec13a8; same db layout): C01/C02 = B07 rebuilt with −12/−18, C03–C04 new `CALCUL`,
  C05 = David's B05 line, C06 = B15 statement with one miscopied sign, C07–C08 `SIGNE_COPIAT` at exp/tra, C09 = David's
  B16 line, C10–C11 three-term `TERMES_NO_SEMBLANTS` (levels 1 and 2), C12 a form-G statement with an older error.
  Approved ones go to `data/banc.json` as `lot2-Cxx`.

## Bank batch 2 reviewed (2026-11-25, ZIP «banc2»)

- **11 of 12 approved** → `data/banc.json` as `lot2-Cxx` (31 examples in all). C11 not approved: David disliked
  «4 and −4» in the statement and proposed `3x − 5 + 4x = 16 → 2x = 16` (batch 3, D01). Batch-3 generated
  candidates reject statements that repeat a number (`variat()` in the batch script; the generator itself does not
  filter this yet).
- **David's two real errors (`reals/notes`) became rules:**
  - `COEFICIENT_U` (red1, red2; pes 3): in a group of ≥ 2 x-terms with a lone ±x, the ±x is not counted
    (`3x + x + 6x = 4 − 2x → 9x = 4 − 2x`; `5x − x → 5x`). Level-1 forms B and G now draw a lone x 30 % of the time
    so that it appears at level 1.
  - `DIST_SUMA` (exp; pes 2): `c·(mx + b)` → x-coefficient sign(c)·(|c| + m), number multiplied correctly
    (`x − 2·(3x + 6) = 3x + 7 → x − 5x − 12 = 3x + 7`). Needs m ≥ 2, |c| ≥ 2, |c| ≠ m.
  - Bracket terms are now `P(c, b, m = 1)` = c·(mx + b) (`cos`, `lineal`, `expandeix(…, malX)`, `perQueBona`,
    `dinsMarge` m ≤ 5; `DISTRIBUTIVA`/`DIST_SIGNE` texts say «per $3x$» when m ≠ 1). New level-2 form H
    `ax + c·(mx + b) = dx + e` (forms C, D, E, F, H equally likely).
- `valida()`: the last line may also be an irreducible fraction with positive denominator (`x = 4/11` has no simp
  step); before, such examples were silently rejected, so a solution like 4/11 could only appear via simp.
- `generaExemple` rejects statements with a superfluous `+ 0` (`zeroSobrer`; form H could write `−x + 0`).
- The batch pages show Claude's reply to the real-errors note (`rep/reals`, `#rep-reals`).
- **Batch 3** «Banc d'errades, lot 3» (https://claude.ai/artifact/K6iU7eSiHW9z5TabkADQeH, slug
  9290c51d-6c23-40f6-9b83-9b1fe0a9acfe): D01 = David's C11 proposal, D02 and D06 = his two real errors exactly,
  D03–D05 `COEFICIENT_U`, D07–D08 `DIST_SUMA`, D09 a form-H statement with `DIST_SIGNE`.

## Research review (2026-11-25, answered; implemented in ZIP «banc3»)

David sent a list of papers on real pupils' errors. Review artifact «Errades documentades a la recerca»
(https://claude.ai/artifact/AkeL6uQEjqyVFAib5k1SEh, slug 4efa3c2d-cac4-46f1-bf2b-d0898c2c9bce; db collection
`respostes` {decisio: si|no|despres|parlem, comentari}, `general/notes`, replies in `rep/<id>` and `rep/general`).
Main source: Erbaş, Çetinkaya & Ersoy (2009, Education and Science 34(152)), 217 pupils, 32 coded mal-rules with
counts (YK13 «Mx ± N → (M ± N)x» 437 = our `TERMES_NO_SEMBLANTS`; YK26 188 ≈ `SIGNE_TRANSPOSAR` with both moved terms;
YK06 157 = `OPERACIO_INVERSA`; YK18 62 = `DISTRIBUTIVA`; YK19 7 = `DIST_SUMA`; YK04 6 = `QUOCIENT_INVERTIT`).
Proposals A1–A9 (new rules: number-only distribution YK20, forgotten coefficient YK01, product of unlike terms YK11,
more inverse operations YK03/YK05/YK06, factor applied after the bracket (Gasa), pair-only unlike terms (Gasa),
two terms moved without sign change YK26 with a multi-answer term phase, factor subtracted (Vale et al.), divide
before transposing (Mathematics in School 1984)), B1–B3 (out of scope: equation as expression, redistribution,
trial and error), C1–C2 (weights from the counts; more arithmetic at levels 4–5).

**David's answers:** yes A2, A4, A7, B1–B3 (keep out), C1; no A1, A3, A5, A6; later A8, A9, C2.
- A2 → `COEFICIENT_OBLIDAT` (div, pes 3): `3x = 12 → x = 12`.
- A4 → `OPERACIO_INVERSA` (pes 4) variants `resta` B − A, `inversa` A − B (double weight when |A| > |B|), `producte`
  A·B, `suma` A + B (data `v`, `W`; per-variant `expl` and «Per què?»). Bank examples made before keep the old
  texts (no `v`: treated as `resta`).
- A7 → `SIGNE_TRANSPOSAR` all moved terms keep their sign (35 % when ≥ 2 move; data `tots`) and `SIGNE_COPIAT` two
  signs (30 % when ≥ 2 copied terms; data `ts`, `mals`) — David's B15. `construeix` stores `termes: [i, j]` when more
  than one token differs; `triaTerme` accepts any of them and `llibreta.js` circles all of them. Such errors are
  never typeable (`escrivible` needs exactly one different token).
- C1 → `pes`: TNS 5; SIGNE_TRANSPOSAR, OPERACIO_INVERSA, CALCUL 4; DISTRIBUTIVA, DIST_SIGNE, COEFICIENT_OBLIDAT 3;
  COEFICIENT_U, SIGNE_COPIAT 2; DIST_SUMA, QUOCIENT_INVERTIT, DIVISIO_SIGNE 1. `DIVISIO_SIGNE` is now very rare at
  level 1 (≈ 1 in 600 seeds); the coverage test still passes but is close to its limit.
- **Later (not done):** A8 factor subtracted `3(x − 2) = 5x → x − 2 = 5x − 3`; A9 divide before transposing
  `3 + 2x = 9 → x = 9/2 − 3`; C2 more arithmetic errors at levels 4–5.

**Bank batch 3:** 8 of 9 approved (D03 not) → `lot3-Dxx`; 39 examples in all.

## Lasso, order of operations and the new index (2026-11-25, ZIP «llac-prioritat»)

David asked, in this order: circle the error with the finger, the order-of-operations activity, and an index
that chooses the activity and every parameter; then he tests both activities with real pupils.
- **Lasso (R3):** `js/motor/llac.js` (pure geometry, `tests/llac.test.js`), `marcaLlac`/`llacDubtos` in `estat.js`
  (state `ltermes`, `traca`), stroke handling in `llibreta.js` (pointer events on `.linies`; a stroke counts only
  after 8 px, so taps still work; capture after that; the click that follows a stroke is ignored). `encercla`
  URL parameter; default = circle on `pointer: coarse`. Consigna says «Encercla…» when active. If the circled
  terms include a wrong term, the term phase is skipped («I has encerclat just el terme equivocat»).
- **Order of operations:** `js/prioritat/generador.js`, `prioritat.html`, `data/errors-prioritat.json`,
  `tests/prioritat.test.js`. Engine changes: `cfg.activitat` (texts and keypad), `parts()` for lines without «=»
  or starting with «=», `^n` exponents in `fm()`, `escrivible` also requires a typeable correct term
  (`valorFitxa` ≠ null: «· 7», «(−3)», «3^2» are never typed). Decisions taken: one level per line; level 1
  without negatives, brackets or powers; no repeated numbers in a statement (David's C11 comment); `RESTA_NEGATIVA`
  only with two positive numbers (`−24 − 5 → 29` was not realistic); `PARENTESI_IGNORAT` and `POTENCIA_DESPRES`
  advance the other brackets/powers correctly in the same line. Two errors only at form 2 (levels 4–5), with one
  more line allowed. No bank for this activity yet.
- **Shared parameters:** `js/motor/parametres.js` (both pages).
- **Index:** one form: activity, level (descriptions per activity), gesture (auto / circle / tap), `noerrors`,
  `escriu`, examples, attempts, seed. `tests/index.test.js` checks that the activity reads back every parameter.
- Browser test: lasso on desktop (mouse drag) and on the phone profile (auto mode, where all the earlier taps keep
  working), the index, and a full order-of-operations example with the «=» check.

## «Per què?» sentence editor (2026-11-26, waiting for David)

Artifact «Frases de "Per què és una errada?" · Equacions» (https://claude.ai/artifact/4tvuyfdzTHayTKBjrFVpQ4, slug
1f8b92d4-e6fd-4cd1-82ff-a9ecefd0b335). 21 situations (rule + variant), 70 unique sentence templates (18 used in more
than one situation), markers `[name]` for per-example values, `$…$` maths, `${a|b}$` fractions. db: `frases/<id>`
{text, nova}, `situacions/<id>` {bona, dolentes:[{id, cond?}], comentari}, `grups/G1…G7` (G1–G3 «unify?»
decisions), `general/notes`, replies `rep/<id>`. The catalogue was checked against the generator's real output
(every sentence of thousands of examples matches a template of its situation). Plan once David answers: move the
sentences to `data/frases-equacions.json` (same structure), make `PERQUE` render templates from it, and rewrite the
bank examples' stored sentences by matching the old templates (3 lot-1 examples keep the old `CALCUL` texts).

## Pedagogy fixes from David's classroom test (2026-11-26, ZIP «ordre-versemblanca», then «versemblanca2»)

- **Errors are located top-down** (`js/motor/estat.js`, `comprova`). If the student checks an error line `i` while an
  earlier error `k < i` is still pending, the line is NOT accepted: message (`tipus: 'info'`) «Abans de mirar aquesta
  línia, revisa les de sobre: hi ha una errada més amunt.»; no attempt is counted, nothing is added to
  `trobades`/`revisades`, and the line stays selectable. Applies to every two-error example (compensating or not).
  Reason: in a compensating pair the second error is correct w.r.t. the original equation (6x+6 = 3x−18 → 18 − 6):
  confirming it first, asking «Per què?» and making the student "correct" it to −18 − 6 is nonsense.
- **Compensating pairs**: generators set `ex.compensades = true` (both activities). `arrossega(ex, i)` returns the earlier
  error `k`; `faseHTML` (`js/motor/llibreta.js`) then shows a `.pista` in the term, «Per què?» and correction phases:
  «Compara-la amb la línia i−1 tal com està escrita, encara que arrossegui l'errada de la línia k.»
- **Plausibility of TERMES_NO_SEMBLANTS** (`jaDistingeix(linies, j)` in `js/equacions/generador.js`, used by
  `candidates`): if an earlier step correctly reduced a side that mixed x-terms and numbers and the result still mixes
  them (15 − 4x + 8 → 23 − 4x), the student evidently knows they are unlike terms, so the rule is not injected at `j`
  (23 − 4x → 19x is no longer generated). Tested over 1200 generated examples. The curated bank was not re-checked
  by this rule (its examples were reviewed by David one by one).
- **Plausibility extended** (David's answers in the review artifact «Versemblança de les errades», slug
  `04afb545-41cf-4464-bb8b-efca1be7b5b3`, 26/11/2026). Rule: an error is not injected at line `j` if an earlier
  CORRECT step already showed the student can do exactly that.
  - Equations, `versemblant(id, linies, ops, j, res)` in `js/equacions/generador.js`, called by `candidates`:
    TERMES_NO_SEMBLANTS (`jaDistingeix`; NOT extended to the other side of the same line: A1 rejected);
    COEFICIENT_U (A2: an earlier correct red1/red2 step reduced x-terms of a side containing a lone ±x);
    CALCUL (A3: only when the same two-term calculation, same values and signs, unordered, was done correctly before;
    `dades.clau` = `clauCalcul(k, [v1, v2])`). All other rules unfiltered (B1–B5 accepted as "leave as is").
  - Order of operations, `versemblant(id, linies, j)` in `js/prioritat/generador.js`: for `FILTRADES` =
    ESQUERRA_DRETA, SUMA_ABANS_RESTA, PRODUCTE_ABANS_DIVISIO, POTENCIA_PER_EXPONENT, POTENCIA_DESPRES (C1–C5), the rule
    is skipped at `j` if for some earlier step `i < j` with the same value as its previous line, `REGLES[id].fes(linies[i−1])`
    applies (the trap was there and the student avoided it). Probed with `creaAtzar(i)`, so the main RNG is untouched.
    PARENTESI_IGNORAT (C6 rejected), RESTA_NEGATIVA and SIGNE_PRODUCTE (D1, D2: real distractions) unfiltered.

## Teachers' review page `banc-errors.html` (2026-11-26, ZIP «banc-errors»)

- David's request: a stand-alone page to share with his department's maths teachers so they rate whether the error
  situations are well chosen. Two sections (equations, order of operations), one concrete example per error type,
  numbered 1–20 continuously (1–12 equations, 13–20 order of operations, so codes are unambiguous). No interaction
  with the exercise (the error is shown circled, with the correct line and the student-facing explanation; a
  checkbox hides them for teachers who want to look first). Per example: «M'agrada molt», «M'agrada», «No m'agrada»
  + optional comment; optional teacher name. Top fixed bar: counter, section links, «Copia codi amb les
  preferències» (clipboard, fallback: a dialog with the text selected).
- Code format (David will paste teachers' codes back to an AI): first line `BANC-ERRORS v1`, `Nom: …`, a legend line,
  then `n VOTE` or `n VOTE | comment` for every example (`VOTE` ∈ MM, M, N, `-`), last line `FI`. Numbers refer to
  the example list printed by `node eines/banc-errors.mjs` for that version.
- v1 content: equations 1–12 are bank examples except 10 (COEFICIENT_OBLIDAT, generated); 13–20 generated.
- Bug found while building it and fixed: POTENCIA_PER_EXPONENT counted the target power inside `ws` (powers with
  b·e ≠ b^e) but `pas()` counts every power, so with a 2^2 before it the wrong power was spoilt (9 + 3·2² − 4² →
  9 + 3·8 − 16). Now indexed among all powers; regression test in `tests/prioritat.test.js`.
- POTENCIA_PER_EXPONENT now spoils EVERY power of the step (David, 26/11/2026: a pupil who believes 3² = 3·2 does it
  to all of them; one right and one wrong in the same step is not plausible): 9 − 2·3² + 5² → 9 − 2·6 + 10. Powers
  with b·e = b^e (2²) come out the same. `dades.ws` lists the spoilt powers; `expl` and the «Per què?» sentence name
  all of them. This also removes the index bug above (the hook no longer picks one power).

## Setup still to do by David (once)

See the numbered steps given in the chat with ZIP 1: create the repository, paste the three workflows from
`docs/workflows/` into `.github/workflows/` through the GitHub web, upload the ZIP to `_uploads/`, create the
Cloudflare Pages project (no build command, output directory `/`) and the domain.

## Known limits

- Examples are generated, not curated: some numbers are big (e.g. `5·(x − 5) = −x − 55`). The curated bank
  (R6) and narrower ranges can fix that in stage 2.
- The browser test (`tests/navegador/prova.mjs`) is not in CI (it needs Playwright and a browser).
