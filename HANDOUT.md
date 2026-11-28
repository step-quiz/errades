# HANDOUT — cold-start brief for the next AI session (2026-11-28)

You are taking over `step-quiz/errades` («Localitza l'errada»). Read in this order: this file, `CLAUDE.md` (hard
rules), `docs/STATE.md` (what the project is today and what is open), `README.md` (files, parameters, generators,
rule tables, template language). `docs/SPEC.md` is the original specification with the IDs of David's decisions;
`docs/HISTORY.md` is the 25–28/11 log (historical, never authoritative). If a document and the code disagree, the
code wins: fix the document.

## Working with David

- Speak **Catalan** to him; MD documents in **English**, written for an AI. He is a maths teacher (realistic,
  documented pupil errors only; he reviews every example) and a C programmer, 6/10 with web tooling.
- **Delivery = a ZIP** whose root is the repo root. He uploads it to `_uploads/`; `unzip-upload.yml` extracts and
  commits; Cloudflare Pages publishes. **Never** create branches, commits or merges yourself. Never write
  `[skip ci]`, `[ci skip]` or `[cf-pages-skip]` anywhere. Put only files you changed in the ZIP: a stale copy
  overwrites his own edits (he edits files himself), so start from the latest repo state he gives you.
- **A ZIP cannot delete files.** For a deletion, give him numbered steps with a copy-paste block for the Codespace
  (`git pull`, `git rm …`, `git commit -m "…"`, `git push`) and explain each command.
- Give upload, commit and test steps numbered, with copy-paste blocks, and explain what each one does.
- Decisions: **only** with the multiple-choice dialog (≤ 4 questions, 2–4 options, the recommended one first with
  «(Recomanat)»). **≥ 5 points to decide → a review artifact** (categories, IDs, «Sí, fes-ho / No / Més endavant /
  En parlem», comment, autosave in the artifact db, counter, «Sense resposta» filter; replies in `rep/<id>`). When
  he says **«Revisa artifact»**, read his answers, reply to every point inside the artifact and do what he approved.
- In artifact code never name anything `claude`; test the page with a mocked `window.claude` before publishing.
- Before delivering: `node tests/run-all.js` (all green) and, if the UI changed,
  `CHROME=/usr/bin/google-chrome node tests/navegador/prova.mjs` (Playwright: `npm install --no-save playwright-core`).
  Tell him the result.

## Procedures

**Sentence editor round** (David says «Revisa artifact» on https://claude.ai/artifact/9bXYd1w2wk9GsL1mGZj8ys,
slug `459b38ba-e06d-4ebd-a5c6-0564025c1fce`):
1. `db_list` the collections `frases`, `situacions`, `general`, `rep`, and read the artifact's comments.
   `frases/<id>`: `{text, nova, autor:'david'|'claude', de?}` (`N…` ids are copies the editor made when he typed in a
   shared sentence; `de` = the original). `situacions/<id>`: `{bona, dolentes:[{id, cond?}], comentari}` — the truth
   about which sentence belongs where; a situation missing from the collection uses `dades.json`.
2. Check every sentence against its situation's sample (true sentence true, distractors false for *every* example
   of the situation, markers that exist there). Answer his comments in `rep/<id>` (`db_write` needs `ifVersion` on
   existing docs, ≤ 50 ops per call). With ≥ 5 points to decide, a review artifact.
3. Write `eines/frases-editor/editor-db.json` = `{ "frases": {id: data}, "situacions": {id: data} }`, then
   `node eines/frases-editor/exporta.mjs`, `node eines/frases-editor/banc.mjs`, the tests, the ZIP.
4. Never rewrite his text; never add or move `\bold`. You may rewrite sentences with `autor:'claude'`.
5. To change the editor page: edit `plantilla.html` and/or `dades.json`, rebuild `index.html` (replace `/*DADES*/`
   with `dades.json`, `</` escaped), run `prova.mjs` and `prova-focus.mjs`, republish the same artifact (read its
   version first; the capabilities `{db:{}, user:{}}` stay).

**Style David taught for sentences** (apply when you write one): name the wrongly written term («És una errada
escriure 23, hauria de ser −23»); say what should have been done with «Hauria d'haver…» / «Caldria haver…»; link
cause and consequence with «: per tant,»; keep it short; no article before numbers after the verb («multiplicar 4
per −1»); use the «membre» markers (`[membre]`, `[al membre]`, `[Al membre]`, `[del membre]`, `[l'altre membre]`…),
never the word «membre» itself.

**New error rule:** generator rule + `expl`, a situation in the editor catalogue and `situacio()` in
`js/equacions/frases.js` (equations) or a `PERQUE` entry (order of operations), the taxonomy JSON, README and SPEC
rows, tests. Only rules David asked for or real pupils' errors.

## Where things stand

See `docs/STATE.md` «Open work». In short: David tests the site with pupils; the new editor has four situations
(SAP, IX, DEN1, DEN2) with sentences written by Claude that David has not reviewed yet; a few open questions are
listed there for the dialog. Audit 2 (28/11/2026) is in progress: stages 1–2 delivered, stages 3–4 in STATE item 8;
on «Revisa artifact» for slug `01cf84b6-…`, read db `respostes`, reply in `rep/<id>` (`{ text }`), do what David approved.
