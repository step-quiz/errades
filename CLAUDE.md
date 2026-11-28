# CLAUDE.md — errades

<!-- regles-comunes:inici -->
## Regles comunes de Step Quiz

*Aquest bloc és igual a tots els repositoris de `step-quiz`. Les regles específiques d'aquest
repositori, si n'hi ha més avall, manen sobre aquestes quan diuen una altra cosa.*

- **Llengua.** Parla amb l'usuari en català. Tot el que veu l'alumnat, també en català.
- **L'usuari.** David, llicenciat en Matemàtiques i professor d'ESO i Batxillerat a Catalunya.
  Programa en C i dissenya algorismes; d'HTML, CSS, JS, Git, GitHub, Codespaces i LaTeX en sap
  el que cal per fer-los servir, no més. Quan hagi de fer alguna cosa (pull, push, commit, pujar
  un ZIP, compilar…), dona-li els passos numerats, amb les ordres o els textos per copiar i
  enganxar, i explica què fa cada pas.
- **ZIP.** Els ZIP que lliuris, l'usuari els puja a `_uploads/` (GitHub → `_uploads/` →
  *Add file* → *Upload files*), i el workflow `unzip-upload.yml` els descomprimeix a l'arrel i en
  fa commit. Per tant, les rutes de dins del ZIP comencen a l'arrel del repositori (`js/app.js`,
  no `projecte/js/app.js`): cap carpeta que ho contingui tot. El que hi hagi a `.github/` s'ignora;
  els workflows es canvien des del web de GitHub.
- **Publicació.** Els webs es publiquen amb Cloudflare Pages a cada commit de `main`. Cap missatge
  de commit pot portar `[skip ci]`, `[ci skip]` ni `[cf-pages-skip]`, tampoc els dels workflows
  que desen fitxers generats: Cloudflare no publicaria aquell commit.
- **Webs estàtiques.** HTML, CSS i JavaScript sense compilació ni servidor, si aquest repositori
  no diu el contrari. Cap dada personal de l'alumnat en un repositori públic.
- **Documentació.** Si canvies el comportament, posa al dia el README i els documents que el
  descriuen en el mateix commit. Si el codi i un document no coincideixen, el que s'ha
  d'arreglar és el document.
- **Proves.** Abans de lliurar res, passa les proves del repositori i digues-ne el resultat.
<!-- regles-comunes:fi -->

## This repository (English from here on: documents for an AI)

**Localitza l'errada** (`step-quiz/errades`): erroneous-example activities. A fictitious pupil solves an
exercise in a squared-paper notebook and makes one or more errors; the real student finds the line, says why
it is wrong and what it should have been. Read first:

1. [`HANDOUT.md`](HANDOUT.md) — how to work with David and the recurring procedures.
2. [`docs/STATE.md`](docs/STATE.md) — what the project is today and what is open (wins over SPEC).
3. [`README.md`](README.md) — files, URL parameters, how the generators work, template language.
4. [`docs/SPEC.md`](docs/SPEC.md) — the original specification and every decision with its review-artifact ID
   (`docs/HISTORY.md` is the 25–28/11 log: history only).

Hard rules (David's, all approved in the review artifact «Localitza l'errada»):

- **The one definition (N1):** an error is a line that cannot be deduced from the line above *as written*
  (equations: different solution set; order of operations: different value). Lines that follow correctly from a
  wrong line are not errors.
- **Two activities, one engine:** `equacions.html` (`js/equacions/`) and `prioritat.html` (`js/prioritat/`) share
  `js/motor/*` (state machine, notebook, lasso, session, URL parameters, levels, randomness, «Per què?» options). A new activity = a generator with the same example
  format + a page + `cfg.activitat` texts in `llibreta.js` + an entry in the index (`js/index.js`).
- **Realistic, documented errors only:** David rejects mal-rules no pupil would make (e.g. `−3 + 15 → 10`) and
  statements that repeat numbers; new rules come from his comments, his pupils' real errors or published studies
  (see `docs/STATE.md`, research review).
- **Two colour layers (R1):** the notebook (red = teacher's pen, ONLY for errors; pencil grey ✓ for correct
  lines) vs. the real student's answer (lilac = right, grey = wrong; never red/green; always with text).
- **Fonts (R2):** Kalam for the pupil, Permanent Marker for the teacher's correction, self-hosted in
  `vendor/fonts/` (no third-party requests: the students are minors).
- **Notebook only (P1)**, lines aligned at «=» (R4), line numbers (P2).
- **Hover rule:** every clickable control gets a thick pure-black border and a light-grey background on hover,
  with no layout shift (`box-shadow`). Mouse only: `html.tacte` (set after a finger or pen touch) disables it, so it
  never sticks under a finger (audit T1, 28/11/2026).
- **Nothing moves by itself (David, audit 28/11/2026):** never let content shift by a few pixels (messages, buttons,
  scrollbars, term buttons). See README «Nothing moves by itself».
- Student-facing text: Catalan, second person singular, short; maths in `$…$` with `{a|b}` for fractions.
- **Shared files** (`js/comu/*`, `css/seguent.css`, `LICENSE`, `LLICENCIA.md`) come from
  `step-quiz/step-quiz-commons` (daily workflow «Fitxers comuns»). Never edit them here.
- Work in stages, human-in-the-loop (R8): say what the stage will do, deliver, let David test, then continue.
- **A ZIP cannot delete files** (`unzip-upload.yml` only adds and overwrites). To remove a file, give David the
  `git rm` commands for the Codespace, step by step.
- **«Per què?» sentences are David's** (sentence editor, `eines/frases-editor/`; `HANDOUT.md` has the procedure).
  Never add or move `\bold` in them, and never rewrite his text without asking.

Tests (from the repository root):

```
node tests/run-all.js
```

Browser smoke test (local only; needs Playwright: `npm install --no-save playwright`):

```
node tests/navegador/prova.mjs
```
