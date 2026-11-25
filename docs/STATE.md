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
- **«Per què?» options are all generic** (from `data/errors.json`): a specific right option next to generic
  distractors would give the answer away. The specific explanation (`expl`) is shown after the choice.
- `package.json` exists only for `"type": "module"` (Node tests). Cloudflare Pages must have no build command.

## Setup still to do by David (once)

See the numbered steps given in the chat with ZIP 1: create the repository, paste the three workflows from
`docs/workflows/` into `.github/workflows/` through the GitHub web, upload the ZIP to `_uploads/`, create the
Cloudflare Pages project (no build command, output directory `/`) and the domain.

## Known limits

- Examples are generated, not curated: some numbers are big (e.g. `5·(x − 5) = −x − 55`). The curated bank
  (R6) and narrower ranges can fix that in stage 2.
- The browser test (`tests/navegador/prova.mjs`) is not in CI (it needs Playwright and a browser).
