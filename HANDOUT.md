# HANDOUT — cold-start brief for the next AI session (2026-11-26)

You are taking over `step-quiz/errades` («Localitza l'errada») from a long session that ran out of context.
Read this file, then `CLAUDE.md` (hard rules), `docs/STATE.md` (what is done, newest decisions at the end),
`docs/SPEC.md` and `README.md` (files, generator, rules table). When this file and the code disagree, the code
and `docs/STATE.md` win; fix this file.

## 0. Ground rules that bit us

- **The GitHub repo is the only source of truth.** David edits files himself (latest: `index.html`,
  `js/index.js`, `css/index.css`, `css/peu.css`, `icon.png`, `vendor/img/`, `tests/navegador/prova.mjs`,
  `tests/docs.test.js`, README/STATE sections «Simplified index»). **Start every task from a fresh clone**
  (`git clone https://github.com/step-quiz/errades`), never from an old ZIP or workspace copy, and **never put a
  file in a delivery ZIP unless you changed it in this clone** — a stale copy overwrites his work.
- **No git branches, commits or merges from the AI** (David, 26/11/2026): deliver only ZIPs; he uploads them.
- Delivery = a ZIP whose root is the repo root, uploaded by David to `_uploads/`; `unzip-upload.yml` extracts and
  commits; Cloudflare Pages publishes. Never write `[skip ci]`, `[ci skip]` or `[cf-pages-skip]` anywhere.
- Before delivering: `node tests/run-all.js` (all green) and, if UI changed,
  `CHROME=/usr/bin/google-chrome node tests/navegador/prova.mjs` (Playwright via `npm install --no-save playwright-core`).
- David's preferences: speak **Catalan** to him; MD documents in **English** for an AI; give upload/commit steps
  numbered with copy-paste blocks; ask decisions **only with the multiple-choice dialog** (AskUserQuestion, ≤ 4
  questions, 2–4 options, recommended first with «(Recomanat)»); **≥ 5 decision points → a review artifact**
  (categories, IDs, buttons «Sí, fes-ho / No / Més endavant / En parlem», comment, autosave in the artifact db,
  counter, «Sense resposta» filter); when he says **«Revisa artifact»**, read his answers, reply per point inside
  the artifact (`rep/<id>` docs) and do what he approved. In artifact code never name anything `claude`; test the
  page with a mocked `window.claude` before publishing.
- David is a maths teacher: realistic, documented pupil errors only; he reviews every example himself.

## 1. What this session delivered (all uploaded; repo is in sync as of commit a4b37f3)

Engine / pedagogy
- **Errors are located top-down** (`js/motor/estat.js`): checking an error line while an earlier error is pending
  → info message «Abans de mirar aquesta línia, revisa les de sobre…», no attempt counted, line stays selectable.
- **Compensating pairs** (`ex.compensades`): `arrossega(ex, i)`; a `.pista` in the term / «Per què?» / correction
  phases says «Compara-la amb la línia i−1 tal com està escrita…» (`js/motor/llibreta.js`).
- **Plausibility filters** («an error is not injected if an earlier correct step already showed the skill»):
  equations `versemblant()` — TERMES_NO_SEMBLANTS (`jaDistingeix`, between lines only), COEFICIENT_U, CALCUL (same
  two-term calculation only); order of operations `versemblant()` + `FILTRADES` (ESQUERRA_DRETA, SUMA_ABANS_RESTA,
  PRODUCTE_ABANS_DIVISIO, POTENCIA_PER_EXPONENT, POTENCIA_DESPRES). Decisions: review artifact «Versemblança de les
  errades» (slug `04afb545-41cf-4464-bb8b-efca1be7b5b3`, closed; answers in its db `respostes/*`, replies `rep/*`).
- **POTENCIA_PER_EXPONENT** spoils every power of the step (old index bug fixed); `retoca` offers b + e and b^(e+1).

New equation rules (README rules table has the details)
- `SUMA_ABANS_PRODUCTE` (op `exp`): 3 + 2·(x − 4) → 5·(x − 4) (65 %) or → 5x − 4. Level-2 form E has a «+» 40 %.
- `INVERS_X` (op `inv`): 30/x = 5 → x = 30·5. Term kinds `I(a)` = a/x and `M(a, b)` = a·b; level-1 form I.
- `CANVI_SIGNE_PARCIAL` (op `neg`): −4x + 5 − 3x = 6 − x → 4x − 5 + 3x = 6 + x (one term keeps its sign); form K.
- `DENOMINADORS` (op `den`): (3x + 5)/2 − (x − 4)/3 = 5x → 9x + 15 − 2x − 8 = 30x (variant `signe`) or terms
  without denominator not multiplied (variant `sense`, my addition, **not yet approved by David**). Term kind
  `D(s, m, b, den)`; form L.
- `OPS = den, exp, neg, red1, tra, red2, inv, div, simp`. Lines with kinds `i/d/m` accept only the three new rules
  (`NOVES`). Rules may force circled tokens with `dades.marca`. Fixed statements (`e0`) skip line limits and
  number margins (both generators). `encaixaBanc` reads the form from `ex.nivell`.
- `QUOCIENT_INVERTIT`: own explanation for the «twin» case |A| > |B| (12x = 3 → x = 12/3).

Teachers' review page
- `banc-errors.html` (generated: `node eines/banc-errors.mjs` from `eines/banc-errors.plantilla.html`; never edit
  the HTML by hand). **v3, 28 examples**: equations 1–20, order of operations 21–28 (the script prints the list
  with numbers — use it to decode codes). Votes MM/M/N + comment, `localStorage`, fixed bar with «Copia codi amb
  les preferències» (turns green «Codi copiat» for 5 s). Code format: `BANC-ERRORS v3`, legend line,
  `n VOTE[ | comment]`, `FI`. David's own v1 feedback is fully applied (items 9, 12, 13, 17).

## 1b. Term phase at every level (2026-11-26, after the handout was first written) — DONE, awaiting David's test

Task from David: on touch devices pupils circle either (1) the whole error line, or (2) the line and the wrong
term. (1) → confirm the line and ask for the term; (2) right term → fine; wrong (correct) term but right line →
ask again for the term, and it costs one attempt. Dialog answers: at **every level**; a correct term chosen
**costs an attempt** (shared with wrong lines; at `maxintents` the term is shown and the example is worth 0); the
same for **mouse clicks** (= case 1). Implemented in `js/motor/estat.js` (`termeFallat`), `cfg.terme` removed
everywhere; details in `docs/STATE.md` «Term phase at every level». `node tests/run-all.js` and the browser test
(130 checks) pass. If David reports problems after testing, fix them before item 2.1 below.
Follow-up (same day): while the finger is still circling, no line looks selected; it is marked when the finger
lifts (`.dibuixant`, `.toc`; `docs/STATE.md` «Lasso: mark the line only when the finger lifts»).

## 2. Open work, in priority order

1. **Sentence editor «Frases de "Per què és una errada?" · Equacions»** — artifact slug
   `1f8b92d4-e6fd-4cd1-82ff-a9ecefd0b335`, https://claude.ai/artifact/4tvuyfdzTHayTKBjrFVpQ4, live version
   `1795678340-090d`, capabilities `{db:{}, user:{}}`. **David is filling it in now.** When he says «Revisa
   artifact»:
   - Read db collections `frases` (F01…F70: `{text, nova, autor:'david'|'claude', actualitzat}`), `situacions`,
     `grups` (G1–G7), `general/notes`, and any comments; reply in `rep/<id>` (db_write needs `ifVersion` on
     existing docs, ≤ 50 ops per call, 2 s apart). Learn from his edits (style rules are in `rep/general`).
   - Then integrate: move the sentences to `data/frases-equacions.json`; make `PERQUE` in
     `js/equacions/generador.js` render from it; implement the template language — markers `[nom]` (auto-maths
     outside `$…$`; list in `eines/frases-editor/dades.mjs`, e.g. `[x]`, `[escrit]`, `[terme d'abans]`,
     `[altre membre]`, `[operació]`, `[terme en x]`, `[producte]`, `[valor del producte]`, `[Els termes]`,
     `[càlcul]`), maths `$…$`, fractions `${a|b}$`, macros `\bold{…}` (only where David put it), `\oposite{…}`
     (opposite with explicit sign), `\signe{…}` (explicit sign); ASCII `-` before a digit/x/`$`/`[`/`\` renders
     as `−`. Rewrite the stored sentences of `data/banc.json`. Tests, docs, ZIP.
   - The editor does **not** yet contain the new rules (SUMA_ABANS_PRODUCTE, INVERS_X, CANVI_SIGNE_PARCIAL,
     DENOMINADORS) nor the order-of-operations sentences. Offer to add them afterwards (new F ids; never
     overwrite his docs).
   - Editor sources are now in the repo: `eines/frases-editor/` (run from that folder: `node cataleg.mjs`,
     `node dades.mjs`, then build `index.html` from `plantilla.html` by replacing `/*DADES*/` with `dades.json`
     (escape `</`); tests `prova.mjs`, `prova-focus.mjs`, `prova-text.mjs` mock `window.claude`;
     `canvis.json` = texts written by Claude/David in the session). Republish with `publish_files` and the live
     `base_version`; keep the capabilities.
2. **Teachers' codes**: David will paste the department's `BANC-ERRORS v3` codes. Tally per example (MM/M/N),
   list comments, propose changes (≥ 5 points → review artifact).
3. **Open questions to put to David** (dialog): approve or drop the `DENOMINADORS` variant `sense`; the three new
   rules appear in ~1 % of generated examples each — raise their frequency?; POTENCIA_PER_EXPONENT in the game
   always shows two powers (level line limits) — allow single-power statements?
4. David will test both activities with real pupils; expect feedback rounds.

## 3. Map of the session's workspace (gone in the new session)

Everything that matters is in the repo. The review artifacts and their databases persist on claude.ai and can be
read with the artifact tools (`db_list`, `read_artifact`) using the slugs above.
