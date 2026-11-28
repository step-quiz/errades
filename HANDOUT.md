# HANDOUT — cold-start brief for the next AI session (updated 2026-11-28)

## START HERE (2026-11-28) — this section wins over everything below it

**State of the repo.** The last delivery is the ZIP `errades-frases-web.zip` (28/11): David's «Per què?» sentences
are now on the site. Details: `docs/STATE.md` «"Per què?" sentences from David's editor (2026-11-28)». If
`git log` does not show an «Auto-extract uploaded zip» commit after 28/11 with `js/equacions/frases.js`, ask David
whether he uploaded it. **Never** create branches, commits or merges: David works only with ZIPs. Tests:
`node tests/run-all.js` (green); browser test: `node tests/navegador/prova.mjs` (138 checks; needs Playwright).

**Access problem (28/11).** The claude.ai account used on 28/11 cannot see the two artifacts below (they belong to
another account or organisation): `get_artifact`/`db_list` answer «not found». David pastes the editor's
«Copia els canvis» text instead (saved as `eines/frases-editor/editor-2026-11-28.txt`). The review artifact
«Revisió de les frases» (https://claude.ai/artifact/7MzsaTfGaw1nUxDKz1Rdtm, slug
`33855f4c-353c-496d-b944-0b66a4bc00aa`, db `respostes/*`, `rep/*`) IS on the current account: closed, all 16
points answered and replied to.

**How the sentences reach the site now.** `node eines/frases-editor/exporta.mjs` (editor export + `CANVIS`) →
`js/equacions/frases-dades.js`; `node eines/frases-editor/banc.mjs` → rewrites the «Per què?» of `data/banc.json`.
After a new editor round: save the new export, point `exporta.mjs` to it, rerun both, run the tests.
`js/equacions/frases.js` = template renderer + situation/values per rule + choice (conditions, missing markers,
reserves). **David's rule (Q2, 28/11): never add or move `\bold` in his sentences.**

**The two review artifacts (claude.ai, owned by David, private):**

| Artifact | URL | Source in repo | State |
|---|---|---|---|
| «Frases de "Per què és una errada?" · Equacions» | https://claude.ai/artifact/4tvuyfdzTHayTKBjrFVpQ4 | `eines/frases-editor/` (`plantilla.html` + `dades.json` → `index.html`) | **David finished reviewing ALL of it on 27/11/2026.** Live version `1795770122-4e9b`, capabilities `{db:{}, user:{}}` |
| «Textos de Localitza l'errada» (fixed interface texts) | https://claude.ai/artifact/3gaQsuKu2Dd5T9siGEwnLn | `eines/textos-editor/index.html` | **Done.** All 51 edits applied in the code on 27/11 (`docs/STATE.md` «Interface texts») |

### How David resumes the sentence editor with you (no work is lost)

- Everything he types is saved automatically in the artifact's database, not in the page. Republishing the page
  never erases his work, provided you **keep the database collections and the ids**. He opens the URL and carries on.
- Database layout (read with `ArtifactData`, url above):
  - `frases/<id>`: `{text, nova, autor:'david'|'claude', de?, actualitzat}`. Ids `F01`–`F70` come from the
    catalogue. `N…` ids are copies the editor made when David typed in a shared sentence; `R…` ids are copies Claude
    made on 27/11 to repair shared sentences. `de` names the sentence a copy came from.
  - `situacions/<id>`: `{bona, dolentes:[{id, cond?}], comentari}`. **This is the truth about which sentence belongs
    to which situation.** Situations missing from the collection use the catalogue default in `dades.json`.
  - `grups/G1..G7` (decisions on similar sentences: done), `general/notes` (David's general comments),
    `rep/<id>` and `rep/general` (Claude's replies, shown inside the page).
- When David says «Revisa artifact»:
  1. Read all collections.
  2. Learn from his edits.
  3. Answer each comment in `rep/<situation id>`. Pin every write: pass `if_version` with the version the read
     listing shows (the files `out_dir` saves do not include it); at most 50 writes per batch.
  4. Rewrite only sentences with `autor:'claude'`.
  5. Never overwrite his text, except to swap in a marker when he asks for one.
- **Style rules learned from David** (apply to every sentence you write; full text in `rep/general` v2):
  - Name the wrongly written term: «El −x no és correcte…», «És una errada escriure 23, hauria de ser −23».
  - Say what should have been done with «Hauria d'haver…» / «Caldria haver…».
  - Link cause and consequence with «: per tant,».
  - Keep it short, without tails like «d'aquesta línia».
  - Put `\bold{}` on the key word of every sentence, distractors included.
  - Keep 3–4 distractors per situation.
  - No article before numbers after the verb («multiplicar 4 per −1»).
  - Leave alone F53–F58 (inverse operation): David dictated them.
- **Template language** (rendered by `render()` in `plantilla.html`; the website must implement the same):
  - `[marker]` = a value of the example; outside `$…$` it becomes maths automatically.
  - `$…$` = maths; `${a|b}$` = a fraction; an ASCII `-` before a digit, `x`, `$`, `[` or `\` shows as `−`.
  - Macros: `\bold{}`; `\oposite{}` (the opposite, with explicit sign: −1 → +1, x → −x); `\signe{}` (explicit
    sign: 3 → +3); `\nosign{}` (value without sign: −23 → 23).
  - Two-term situations ST2 and SC2 also have `[primer terme]` and `[segon terme]`.
  - «Membre» markers: `[membre] [membres] [el membre] [al membre] [l'altre membre] [el seu membre] [al seu membre]
    [els dos membres]`. They take the word chosen in the index: membre (default) | costat | banda | part; membre and
    costat are masculine, banda and part feminine. Example: «l'altra banda», «les dues bandes».
- **Shared sentences:** when David types in a sentence used by several situations, the editor makes a copy for that
  situation only (`de` = original id); the button «Aplica-la a totes» on the copy makes it common again. David chose
  this on 27/11 after edits in one situation broke others.
- **Pitfall that already bit us:** `eines/frases-editor/cataleg.json` is STALE. `dades.json` is the source of truth;
  `dades.mjs` throws on purpose. To change the page: edit `plantilla.html` and/or `dades.json`, then rebuild
  `index.html` by replacing `/*DADES*/` with the contents of `dades.json` (escape `</` as `<\/`). Test with a mocked
  `window.claude` (never name anything `claude` in the page code). Republish the **same file path** with
  `url: https://claude.ai/artifact/4tvuyfdzTHayTKBjrFVpQ4` and **omit `capabilities`**. The tool asks you to Read the
  live version first.
- Check at the end of 27/11: every sentence of every situation uses only markers its situation has. To re-check,
  compare the markers of each `situacions/<id>` sentence with `dades.json` → `situacions[].marcadors`.

### What is pending, in order

0. **Confirmed by David (28/11):** F25 with `[mal]`, CAL2's new true sentence C01, reserves ST1 F18+F20, CAL1 F51,
   DSIG1 F08 (`exporta.mjs`, `CANVIS` and `RESERVA`). David tests the published site next.
1. **Sentence editor follow-up.** The editor artifact was not republished (no access): the repo sources
   (`dades.json`, `plantilla.html`, `index.html`) already know `[costat]`, `[Al membre]`, `[del membre]` and SC1
   `[altre terme]`. Next round: offer to add the 4 newer rules (SUMA_ABANS_PRODUCTE, INVERS_X,
   CANVI_SIGNE_PARCIAL, DENOMINADORS, still on `PERQUE`) and RESTA_GIRADA / order-of-operations sentences.
2. **The department's survey (`BANC-ERRORS v3`): 4 of 6 answers received on 27/11, 2 still missing.** The tally,
   comments and raw codes are in [`docs/enquesta-banc-errors.md`](docs/enquesta-banc-errors.md). Main signals:
   - Item 5 is rejected (3 N); item 24 too (2 N + a comment that it is ambiguous).
   - Items 4, 11, 12, 17, 18 and 22 have 1 N each; item 22's comment says adding all positives and then all
     negatives is valid.
   - One teacher asks for a distributive case with a term before the bracket: `2x+6(x-3)=-24 → 2x+6x-3=-24`.
   - Unanimous MM: 2, 7, 13, 19, 20, 21.
   - **Weighted ranking** (David's weights: MM +3, M +2, not rated 0, N −4; full tables in the docs file), best
     first, item (points):
     - Equations: 2 (12), 7 (12), 13 (12), 19 (12), 20 (12), 15 (11), 1 (10), 6 (10), 14 (10), 8 (9), 3 (8), 16 (8), 9 (7), 10 (7), 11 (1), 17 (1), 18 (1), 4 (0), 12 (0), 5 (-10).
     - Order of operations: 21 (12), 23 (10), 25 (10), 26 (10), 28 (10), 27 (8), 22 (4), 24 (-6).
     - **New, added by David with 10 points:** rule `RESTA_GIRADA`, `3 − 8 · 5 → 40 − 3` (a real pupil's error,
       27/11/2026; already implemented, see `docs/STATE.md`). It ranks with 23, 25, 26 and 28. Add it to the
       sentence editor and to `banc-errors.html` in the next round.
     Keep the two categories separate. Recompute with the same weights when the 2 missing answers arrive.

   When David pastes the 2 missing codes, add them to that file, redo the tally and propose changes per item. That
   is ≥ 5 points, so use a review artifact. Decode the item numbers with `node eines/banc-errors.mjs`.
3. **Open questions** (ask with the multiple-choice dialog):
   - Approve or drop the `DENOMINADORS` variant `sense`?
   - Raise the frequency of the newer rules, now ~1 % each?
   - Allow statements with a single power for POTENCIA_PER_EXPONENT?
4. **David tests the published site** with pupils (term phase, lasso, new texts); expect feedback rounds.

Sections below are the earlier history, kept for detail. Where they disagree with this section, this section wins.


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

## 1a. Session 2026-11-26/27 delivered (ZIP «errades-textos-2»)

Term phase at every level, lasso marks the line only when the finger lifts, interface texts rewritten by David.
All in one ZIP; tests green (`node tests/run-all.js`, browser test 134 checks). No git branches: David uploads ZIPs.

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

0. **Interface texts editor «Textos de Localitza l'errada»** — https://claude.ai/artifact/3gaQsuKu2Dd5T9siGEwnLn,
   source `eines/textos-editor/index.html`. **DONE 2026-11-27**: David's 51 edits applied (see `docs/STATE.md`
   «Interface texts»); awaiting his test of the published site. The catalogue inside the page still shows the OLD
   texts as «original»: if David wants another round, update the catalogue `G` to the current texts first and
   republish the same file path (keep `capabilities` by omitting it), then delete or ignore the old db docs.
1. **Sentence editor — round 2 done 2026-11-27.** Claude re-read David's edits (F16–F30), rewrote its 29 remaining
   sentences in his style (rules in db `rep/general`, v2: name the wrongly written term, «Hauria d'haver… / Caldria…»,
   cause «: per tant,», short, bold key word in every sentence), left F53–F58 (dictated) untouched, and republished
   the editor (version `1795763701-dac8`) with: `\nosign{…}` (value without sign), `[primer terme]`/`[segon terme]`
   (ST2, SC2), and **«membre» markers** `[membre] [membres] [el membre] [al membre] [l'altre membre] [el seu membre]
   [al seu membre] [els dos membres]` resolved from a word chosen in the index (membre|costat|banda|part, default
   membre; masc membre/costat, fem banda/part). David's F16/F18/F19/F22/F24 now use them. **Integration must add:**
   an index parameter for that word (+ README/index tests), the three features in the template renderer, and the
   generator values for `primer terme`/`segon terme`. Then continue with the rest of this item as below.
   **Fix (same day, afternoon):** that republish had rebuilt `dades.json` from a STALE `cataleg.json` and dropped markers
   ([Els termes], [escrit], [càlcul], [operació]…). `dades.json` is now the source of truth (live data of version
   `1795678340-090d` + [primer terme]/[segon terme]/[altre càlcul]/[termes en x]); `dades.mjs` throws on purpose.
   Shared sentences David had edited for one situation were split (new db docs `R01TNS1`, `R16SC1`, `R16ST2`,
   `R44DSIG2`, `R08CAL1`, each with `de: <original id>`). The editor now auto-copies a shared sentence when David types
   in it (button «Aplica-la a totes» on the copy). Live version `1795768610-68e0`. Integration: sentences are per
   situation (`situacions/<id>.bona/dolentes`), and copies are new ids, not F01–F70.
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
