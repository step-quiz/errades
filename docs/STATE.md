# Localitza l'errada — current state (2026-11-28)

What the project is **today**, for an AI or a developer. Update it in the same commit as any change, by editing the
paragraph that changed (do not append a dated log: the log of 25–28/11 is `docs/HISTORY.md`, historical only).
Authority: the code, then this file and `README.md` (how it works, file table, rule tables), then `docs/SPEC.md`
(the original specification and the IDs of David's decisions). `HANDOUT.md` says how to work with David.

## Stages (SPEC §9)

| Stage | Status |
|---|---|
| 1 Skeleton, taxonomy, equation generator, notebook page, «Per què?», «Corregeix-la», points | done |
| 2 Five levels, two errors, compensating pairs, `noerrors`, typed correction (`escriu=1`), curated bank, term phase | done |
| 3 Verification code `LE` + analyser in `operacions` | pending |
| 4 Projector mode | pending |
| 5 Lasso (R3) | done |
| 6 «Caça l'errada del solucionari» in `step-quiz/sol` | pending |
| 7 Other topics: order of operations | done (`prioritat.html`); fractions pending |

## The two activities

- **Equations** (`equacions.html`) and **order of operations** (`prioritat.html`) share `js/motor/*`: state machine,
  notebook, lasso, session, URL parameters, levels (`js/motor/nivells.js`), randomness (`js/motor/atzar.js`) and the
  «Per què?» options (`js/motor/exemple.js`). Each activity has its generator, its taxonomy (`data/errors.json`,
  `data/errors-prioritat.json`) and its page script.
- **Levels** (both activities): 1 one error, announced, form 1 (equations: no brackets, forms A, B, G, I, 4–6 lines;
  order of operations: no brackets, powers or negatives); 2 one error, announced, form 2 (equations forms C, D, E,
  F, H, K, L, 6–8 lines); 3 one error, not announced; 4 two errors, announced, ≈30 % compensating; 5 one or two,
  not announced. `noerrors=1`: ≈1 example in 5 without errors and the count is never announced.
- **Equations only:** curated bank `data/banc.json` (39 examples reviewed by David; ≈1 in 3 examples when one fits
  the level; the 3 `DIST_SUMA` examples lot3-D06–D08 never show because the rule is deactivated) and the URL
  parameter `membre` (word for the sides of the equation in «Per què?»).

## Error rules

Active rules and weights are in the README tables. **Deactivated** after the department survey (`DESACTIVADES` in
each generator; `docs/enquesta-banc-errors.md`): equations `DIST_SUMA`, `CANVI_SIGNE_PARCIAL` and the `5x − 4`
variant of `SUMA_ABANS_PRODUCTE`; order of operations `PARENTESI_IGNORAT`. Their code, taxonomy entries and editor
situations (hidden) are kept; removing an entry from the list brings the rule back. Statement form K was made for
`CANVI_SIGNE_PARCIAL` and still appears as an ordinary level-2 statement.

Plausibility filters (David, «Versemblança de les errades»): an error is not injected at a line if an earlier
correct step already showed the student can do exactly that — equations `versemblant()` for TERMES_NO_SEMBLANTS
(`jaDistingeix`), COEFICIENT_U and CALCUL (same two-term calculation); order of operations `versemblant()` for
`FILTRADES`. Other rules are unfiltered on purpose.

## Interaction (as built)

- Find the first line that cannot be deduced from the one above (N1). Lines are numbered from 0; line 0 is the
  statement and cannot be chosen. Errors are located top-down: an error line checked while an earlier one is
  pending gets an info message and costs nothing.
- Attempts ladder (`maxintents`, default 3): a correct line marked as wrong is explained («Aquesta línia és
  correcta, perquè …») and costs 2 points; the second miss adds the direction; at the limit the error is shown and
  the example is worth 0.
- Term phase at every level: after the line, the wrong term; a correct term chosen costs an attempt. A lasso that
  encloses the wrong term skips the phase.
- «Per què és una errada?»: the true sentence and **2** distractors chosen at random (`DISTRACTORS_PERQUE`); a
  wrong choice costs nothing. «Corregeix-la»: 3 lines, or (`escriu=1`) type the circled term.
- Compensating pairs: a `.pista` reminds the student to compare with the previous line as written.
- All fixed interface texts were rewritten by David on 27/11 (they live in `js/motor/*.js`, `js/index.js` and the
  generators). Never change their wording without asking him.

## «Per què?» sentences

- **Equations:** David's sentence editor is the only source. Artifact «Frases de «Per què és una errada?» ·
  Equacions (editor nou)», https://claude.ai/artifact/9bXYd1w2wk9GsL1mGZj8ys (slug
  `459b38ba-e06d-4ebd-a5c6-0564025c1fce`, this account), db collections `frases`, `situacions`, `general`, `rep`.
  Catalogue `eines/frases-editor/dades.json` (v2, 26 situations: 21 from the first editor + SAP, IX, DEN1, DEN2 and
  the hidden CSP; DSUMA is hidden too). `exporta.mjs` → `js/equacions/frases-dades.js`; `js/equacions/frases.js`
  renders them (template language in the README); `banc.mjs` rewrites the bank's sentences. The generator has no
  sentences of its own any more: a rule without a situation is an error (`frasesErrada`).
- **David's rules for his sentences:** never add or move `\bold` (Q2, 28/11); keep the distractors false for every
  example of the situation; F53–F58 were dictated by him.
- Distractors whose marker has no value in an example (`[altre terme]`, `[altre càlcul]`, `[terme d'abans]`) are
  skipped; `cond` restricts a distractor to a step (`exp`, `red1`, `tra`), to the sign of a lone x, or to |A| ≠ |B|;
  `reserva` sentences fill in when fewer than 2 remain (ST1 F18 + F20, CAL1 F51, DSIG1 F08).
- Bank: 38 of its 42 «Per què?» come from the editor; 4 `CALCUL` errors with a plain wrong value (lot1-B08 line 2,
  B18 line 4, B19 lines 2 and 4) match no situation and keep their older sentences (the true one and 2 distractors).
- **Order of operations:** sentences in `PERQUE` of `js/prioritat/generador.js` (not in an editor yet).

## Teachers' review page and survey

`banc-errors.html` v3 (28 examples, generated by `node eines/banc-errors.mjs`) was the department survey. It is
closed: 8 answers, tally and decision in `docs/enquesta-banc-errors.md`. The page also reads the answers back
(`banc-errors.html#resultats`: paste the codes or load the .docx). Keep v3 unchanged as the survey record.

## Review artifacts (claude.ai)

On the **current** account (readable with the artifact tools): the new sentence editor (above), «Revisió de les
frases» (`33855f4c-353c-496d-b944-0b66a4bc00aa`, closed) and «Revisió del projecte errades»
(`ab178c59-2e05-41d6-93da-99ea9d99eab5`, closed). On **another** account (not readable from here; history only):
the first sentence editor (`1f8b92d4-…`), «Textos de Localitza l'errada», «Localitza l'errada» (SPEC decisions),
the bank batches 1–3, «Errades documentades a la recerca» and «Versemblança de les errades».

## Open work

1. David tests the published site with pupils; expect feedback rounds.
2. Sentence editor: David reviews SAP, IX, DEN1, DEN2 (my starting sentences) whenever he wants; on «Revisa
   artifact», follow `HANDOUT.md`.
3. Survey ideas not done: a distributive case with a term before the bracket (`2x + 6(x − 3)`); check item 22's
   comment (adding all positives, then all negatives).
4. Open questions for David (dialog): raise the frequency of the newer rules (each ≈1 % of generated errors)?
   Allow single-power statements for `POTENCIA_PER_EXPONENT`? Order-of-operations sentences in an editor?
5. Research proposals left for later (David): A8 factor subtracted, A9 divide before transposing, C2 more
   arithmetic errors at levels 4–5.
6. Stages 3, 4, 6 and fractions.

## Known limits

- Generated examples can have large numbers (`5·(x − 5) = −x − 55`); the bank and ranges limit it.
- Situations with |A| = |B| (OI, CO, DS) can run out of distractors; `valida()` rejects such examples and the
  generator picks another error.
- The browser test (`tests/navegador/prova.mjs`) is not in CI (it needs Playwright and a browser).
- A ZIP upload cannot delete files: deletions are done by David with `git rm` (see `HANDOUT.md`).
