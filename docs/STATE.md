# Localitza l'errada — living state

Agent-facing memory between sessions. English. Update it in the same commit as any change.
Spec: [`SPEC.md`](SPEC.md). Where they disagree, this file wins.

## Status (2026-11-25)

| Stage (SPEC §9) | Status |
|---|---|
| 1 Skeleton, taxonomy, generator + tests, notebook page (tap + «Comprova», keyboard, F1/F3, «Per què?», «Corregeix-la» by choice, points) | **DONE** — delivered as ZIP 1, waiting for David's test |
| 2 Five levels, two errors, compensating pairs, `noerrors`, typed correction, curated bank (R6), term phase (R4) | PENDING (the generator already supports 0/1/2 errors and compensating pairs, tested) |
| 3 Verification code `LE` + analyser in `operacions` | PENDING |
| 4 Projector mode | PENDING |
| 5 Lasso (R3) | PENDING (prototype logic in the review artifact) |
| 6 «Caça l'errada del solucionari» in `step-quiz/sol` | PENDING |
| 7 Fractions, then order of operations | PENDING |

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

## Setup still to do by David (once)

See the numbered steps given in the chat with ZIP 1: create the repository, paste the three workflows from
`docs/workflows/` into `.github/workflows/` through the GitHub web, upload the ZIP to `_uploads/`, create the
Cloudflare Pages project (no build command, output directory `/`) and the domain.

## Known limits

- Examples are generated, not curated: some numbers are big (e.g. `5·(x − 5) = −x − 55`). The curated bank
  (R6) and narrower ranges can fix that in stage 2.
- The browser test (`tests/navegador/prova.mjs`) is not in CI (it needs Playwright and a browser).
