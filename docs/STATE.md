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
  wrong answer there or in «Corregeix-la» costs 1 point (audit C5-A, 28/11/2026; it used to cost nothing, E5). «Corregeix-la»: 3 lines, or (`escriu=1`) type the circled term.
- Compensating pairs: a `.pista` reminds the student to compare with the previous line as written.
- Header, progress and session (audit stage 3; README «Header and layout», `sessio.js` row): one-line sticky header
  with progress dots, no way back to the teachers' index, the session continues after a reload (12 h), Patrick Hand;
  final screen «Resum» + «📋 Informe» + «🔄 Tornar a jugar» (with confirmation), like `operacions`.
- Feedback (audit stage 2; README «Feedback»): «Trobades» and «Intents» chips, steps of each error, instruction of
  the current phase, one block under the line with the answered questions kept in view, labels, lasso demo once per browser,
  «Exercici n de N», band «Exercici finalitzat».
- Touch and stability (UI/UX audit of 28/11/2026, stage 1; README «Nothing moves by itself»): search-phase messages
  in the left column (≥ 1000 px) or a fixed bottom bar; tap the selected line again = «Comprova»; lines above a
  found error are ✓ and not selectable; 300 ms click lock after each repaint; hover only with a mouse; dot strip to
  scroll with the finger when the lasso is on; selected line in blue; level 2 of equations is labelled «equacions més
  llargues» (form K has no brackets).
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
2. UI/UX audit (artifact «Auditoria UI/UX · Localitza l'errada», slug `1aa80142-a720-405f-8115-e8a5ce6e7593`, db
   collections `rep` = David's answers, `respostes` = mine). Stage 1 (touch and stability) and stage 2 (feedback
   and texts, README «Feedback»; texts approved in category X, X2 with David's wording; then simplified after his
   «too full» warning: one «Trobades» chip, two options in answered questions, plain-text steps, lighter dots) done.
   Stage 3 done: D1 compact sticky header, D2 progress dots replacing the text, D3 centred order-of-operations lines,
   E1 no «← Activitats» nor «Tria una altra activitat», E2 session saved in `localStorage` for 12 h (David asked to
   save as much as possible: it also survives closing the tab), F1 Patrick Hand. E3 done too: final screen and «Informe»
   like `operacions` (README, `sessio.js` row). The audit is complete.
3. Sentence editor: David reviews SAP, IX, DEN1, DEN2 (my starting sentences) whenever he wants; on «Revisa
   artifact», follow `HANDOUT.md`.
4. Survey ideas not done: a distributive case with a term before the bracket (`2x + 6(x − 3)`); check item 22's
   comment (adding all positives, then all negatives).
5. Open questions for David (dialog): raise the frequency of the newer rules (each ≈1 % of generated errors)?
   Allow single-power statements for `POTENCIA_PER_EXPONENT`? Order-of-operations sentences in an editor?
6. Research proposals left for later (David): A8 factor subtracted, A9 divide before transposing, C2 more
   arithmetic errors at levels 4–5.
7. Stages 3, 4, 6 and fractions.
8. Audit 2 (artifact «Auditoria · Localitza l'errada», slug `01cf84b6-1c0f-4a64-bb8a-f2eeb8e7bd24`, db `respostes` =
   David, `rep` = Claude; README «Audit 2»). Stage 1 done (E1, E2, E3, P6, P9, P10, P11, C5). P8 and W3: no
   (David). Next, each delivered and tested before the following one:
   - Stage 2 done (README «Audit 2»): C1, C2 + P12 («sense dir-ho», David 28/11/2026), C3, C4, C7, C6. The CI
     workflow change is in `docs/workflows/tests.yml`; David pastes it into `.github/workflows/tests.yml` on GitHub.
   - Stage 3: P1, P2 (equal weights for the error types), P3, P4 (editor marks OI/QI/DS), P5, P7.
   - Stage 4: W2 («Repassa les que t'han costat»), W1 (verification code stage 3, exercise code `LE`).

## Known limits

- Generated examples can have large numbers (`5·(x − 5) = −x − 55`); the bank and ranges limit it.
- Situations with |A| = |B| (OI, CO, DS) can run out of distractors; `valida()` rejects such examples and the
  generator picks another error.
- A ZIP upload cannot delete files: deletions are done by David with `git rm` (see `HANDOUT.md`).
