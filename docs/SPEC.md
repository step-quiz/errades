# step-quiz/errades — specification (v0.3, updated 2026-11-28)

> **Audience:** a cold-start Claude that will build the repository `step-quiz/errades`.
> Talk to the user (David, maths teacher, Catalonia) in **Catalan**; everything the student sees is
> **Catalan**; this file is English. Read the common rules block of any `step-quiz` `CLAUDE.md`
> (ZIP delivery to `_uploads/`, Cloudflare Pages, never `[skip ci]`, docs follow code, tests before delivery).
>
> **Origin of the decisions:** the review artifact «Localitza l'errada»
> (https://claude.ai/artifact/8xYMeyJDW3owvTfJgeygSE, on another account: not readable from the current one).
> Point IDs below (G1, E3, R2…) refer to it; both rounds were answered (33 + 8 points). This file keeps those
> decisions and was brought up to date on 2026-11-28 where later decisions changed them. Current state:
> [`STATE.md`](STATE.md), which wins over this file; how it works: `README.md`; history: [`HISTORY.md`](HISTORY.md).

---

## 1. What the activity is

An *erroneous-example* activity: the student sees a resolution written by a fictitious pupil in a
squared-paper notebook and must locate the line(s) where the pupil went wrong. Cycle per example:
**find → explain → fix** (find the line; say why it is wrong; say what it should have been).

### 1.1 The one definition (N1, approved)

> An **error** is a line that cannot be deduced from the line immediately above it *as written*.

Consequences: lines that correctly follow from a wrong line are **not** errors (the classic
`2(x+4) = 13 − 7x → 2x + 4 = 13 − 7x → 2x + 7x = 13 − 4 …`: only line 2 is an error). An example with
two errors has exactly two non-deducible transitions. Line 0 is the statement and can never be an error (G8).

Student-facing instruction (David's wording, rewritten by him on 2026-11-27; «Toca» or «Encercla» depending on
the gesture): «Encercla la primera línia que no es pot deduir de l'anterior.»; two errors: «… les dues línies que,
cadascuna, no es pot deduir de la línia anterior»; no count announced: «Si hi ha alguna línia que no es pot deduir
de l'anterior, encercla-la; si no n'hi ha cap, indica-ho.» (`js/motor/llibreta.js`).

---

## 2. Approved decisions (round 1)

| ID | Decision |
|---|---|
| G1 | The whole line is the target (number, expression, empty space up to the edge), ≥ 48 px tall. Mouse hover: David's rule — thick pure-black border + light-grey background, no layout shift. |
| G2 | **No** step arrows between lines. |
| G3 | Term-level phase: under discussion → see R4 (no zoom; previous line highlighted). |
| G4 | **No** sequential ✓/✗ mode. |
| G5 | Two-step answer: tap selects (neutral dashed outline), «Comprova» answers. «Comprova» exists only while a line is selected, just left of it (2026-11-25). |
| G6 | Keyboard always on: ↑/↓ and 1–9 select a line, Enter = Comprova, Esc = clear; ←/→ in the term phase. aria-live for messages. |
| G7 | Circle with the finger: David wants to try it → R3 (prototype exists). |
| E1 | Mark the found error, but **separate two colour layers** → R1. |
| E2 | Phase «Per què?»: **3 sentences about that very line** (one true and two plausible false ones picked at random from all the error's distractors — David, 28/11/2026; it was 4 before; built from its numbers; David's model, 2026-11-25); a wrong choice costs 1 point (`PUNTS_PER_FALLADA`, audit C5-A, 28/11/2026) and shows the explanation. |
| E3 | Phase «Corregeix-la»: choose among 3, or (teacher's checkbox, `escriu=1`) type **only the circled term**, corrected, with the page's own keypad (David, 2026-11-25). The wrong side is crossed out and the correct line is written below in the teacher's hand. |
| E4 | No final correct chain. **Changed 2026-11-25:** once the error is corrected, the lines that follow are faded to 25 % between two big black parentheses (STATE.md). During «Per què?»/«Corregeix-la» only the wrong line and the one above stay unfaded, and they, the message and the options are kept on screen. |
| E5 | 10 points per example, −2 per correct line marked as wrong, floor 0; 0 if the error had to be shown. Each wrong answer in «Per què?» or «Corregeix-la» costs 1 more point (audit C5-A, 28/11/2026; before, they did not count). Same rule as `operacions/js/punts.js` (`puntsAmbErrors`) and the «Següent» band. |
| G8 | Lines are numbered **0, 1, 2…**; line 0 is the statement: no circle, not-allowed cursor, cannot be selected. A circled number = still a candidate; checked lines lose the circle (2026-11-25). |
| F1 | Wrong tap on a correct line → «Aquesta línia és correcta, perquè» (wording since 2026-11-27, see STATE) + new line + «és correcte haver escrit $+7x$ i també és correcte haver escrit $−8$.» (what was newly written); mark it ✓ (layer C), lock it. Selecting another line clears the message. |
| F2/F3 | Ladder: 1st miss = F1; 2nd miss = F1 + direction («L'errada és més amunt/avall», or «Hi ha dues errades: una més amunt i l'altra més avall»); at `maxintents` = show the (next) error («L'errada era a la línia k.»), example worth 0 (the «amb ajuda» mark was removed on 2026-11-27). `maxintents` default **3** here (operacions default is 4); wrong terms in the term phase count too. |
| F4, F5 | **No** hints (per-line solution; substitution). |
| N2 | Error-free examples only when the teacher enables them → R5 (`noerrors=1`). |
| N3 | Two errors, announced as «Errades trobades: k de 2». |
| N4 | Two compensating errors (right answer, wrong procedure), levels 4–5. Final note (2026-11-27): «La solució … és correcta, però durant la resolució s'han comès dues errades que es compensen. Per tant, la resolució és incorrecta, encara que doni la solució correcta per casualitat.» |
| N5 | Five levels (see §6), adjusted by R5. |
| P1 | **Always the notebook** (squared paper, pupil's blue handwriting, rotating names). The teacher's correction in a completely different typeface → R2. |
| P2 | Line numbers in the margin, always. |
| P3 | **No** «intention» annotations. |
| C1 | Main engine: automatic generation with **mal-rules** injected into a correct solution (§5). |
| C2 | Hand-curated bank: «la IA proposa errades i jo enriqueixo el banc» → R6. |
| C3 | «Caça l'errada del solucionari» approved; proposed to live in `step-quiz/sol` (its data are there), linked from this index (stage 6). |
| C4 | One error taxonomy file (`data/errors.json`, like `cb/errors.json`) before the pilot. |
| I1 | David prefers a **new repository `step-quiz/errades`** → R7 (agent agrees). |
| I2 | Pilot: first-degree equations; then fractions, then order of operations. |
| I3 | Verification code v2 with a new exercise code (proposed `LE`, free in `operacions/js/exercise-codes.js`). |
| I4 | Projector mode (teacher projects, class discusses, teacher taps), later (stage 4). |

## 3. Round 2 decisions (2026-11-25)

| ID | Decision |
|---|---|
| R1 | Two colour layers. **Notebook:** E (error) = teacher's red pen (ellipse around the wrong term, ✗ in the margin, correction text); C (correct line) = grey pencil ✓. **Student:** right = **lilac**, wrong = **grey** (David's choice); never red/green; always with text. Selection before «Comprova» is neutral (black dashed). Code names: `errada`/`correcta` vs `encert`/`noEncert`. |
| R2 | Pupil: Patrick Hand (blue ink; Kalam until the audit of 28/11/2026, F1). Teacher's correction: **Permanent Marker**. Both self-hosted. |
| R3 | Lasso approved (closed stroke → term centres inside the polygon; one line → select it and remember 1–2 terms; ≥ 2 lines, too small or unclear → «Has de tornar a marcar-ho, perquè …»; open underline accepted over one line; then «Comprova»). Default gesture on touch devices; tap for mouse/keyboard. **Stage 5.** |
| R4 | All lines aligned at «=» (grid `1fr auto 1fr`), always. Term phase (no zoom, previous line shaded «compara-la amb aquesta»): at every level since 26/11/2026 (STATE, «Term phase at every level»). |
| R5 | `noerrors=1`: absent → every example has ≥ 1 error and the count is announced; present → ≈ 1 in 5 error-free, count not announced, button «No hi ha cap errada». Checkbox in the link generator. Stage 2. |
| R6 | Curated bank: Claude proposes candidate batches in a review artifact, David approves/edits and adds real errors; approved items go to `data/banc.json`. Stage 2. |
| R7 | New repository `step-quiz/errades`. Shared code via **`step-quiz/step-quiz-commons`** (David: «m'agrada molt la idea d'aprofitar codi»): `punts.js`, `seguent.js`, `seguent.css` now live in commons (`fitxers/esm/`, `fitxers/seguent.css`) and reach this repo through `comuns.json` (web `errades`) and the daily workflow `comuns.yml`. Operacions still keeps its own copies (migrating it is a separate decision). |
| R8 | Stages approved (§9); human-in-the-loop after each one. |

The working prototype (single HTML page) is the artifact above; reuse its logic, texts and examples.

---

## 4. Repository layout (as planned in stage 1; the README has the current file table)

```
errades/
├── index.html  js/index.js  css/index.css      ← index + link generator
├── equacions.html  js/equacions/pagina.js       ← first activity
├── js/equacions/generador.js                    ← pure seeded generator (§5)
├── js/motor/estat.js  llibreta.js  sessio.js     ← state machine, notebook DOM, session
├── js/comu/punts.js  seguent.js  css/seguent.css ← from step-quiz-commons (never edit here)
├── css/tokens.css  pagina.css  llibreta.css
├── data/errors.json                              ← taxonomy (C4)
├── vendor/fonts/                                 ← Patrick Hand, Kalam (bank page only), Permanent Marker (+ licences)
├── tests/  run-all.js  *.test.js  navegador/prova.mjs
├── docs/  SPEC.md  STATE.md  workflows/          ← workflows are pasted into .github/ via the GitHub web
└── CLAUDE.md  README.md  _headers  package.json  _uploads/
```

Static site, ES modules (needs a local server for testing, like `operacions`). No network, no student data.

## 5. Data model and generator

### 5.1 Example (rendered unit; the full format is `perPagina()` of the generators)

```json
{
  "alumne": "la Marta",
  "linies": [["2·(x + 4)", "=", "13", "− 7x"], ["2x", "+ 4", "=", "13", "− 7x"], "..."],
  "errades": {
    "1": { "terme": 1, "tipus": "DISTRIBUTIVA",
           "expl": "El 2 multiplica tot el parèntesi: $2·(x + 4) = 2x + 8$. …",
           "perque": [["…", false], ["…", true], ["…", false]],
           "bona": "2x + 8 = 13 − 7x",
           "opcions": [["2x + 6 = 13 − 7x", false], ["x + 8 = 13 − 7x", false], ["2x + 8 = 13 − 7x", true]] }
  },
  "correctes": { "2": "Aquesta línia és correcta, perquè\nés correcte haver escrit $−9x$ …" },
  "nota": null
}
```

- A line is a list of **terms**; exactly one `"="`. Terms are the tap/lasso units (G3/R3) and carry the red ellipse.
- `correctes[i]` (F1 text) is required for **every** non-error line ≥ 2.
- `perque`: the true sentence and two distractors, written by David in the sentence editor and filled with the
  line's own values (README «How the generator works»).
- Fractions inside a term: `{num|den}`, drawn as stacked HTML (no KaTeX), so that the handwriting font is kept.

### 5.2 Mal-rules for first-degree equations (initial set; ids map to `errors.json`)

| id | Wrong step | Example |
|---|---|---|
| `DISTRIBUTIVA` | factor multiplies only the first term | `2(x+4) → 2x+4` |
| `DIST_SIGNE` | minus before a bracket changes only the first sign | `−(x−3) → −x−3` |
| `SIGNE_TRANSPOSAR` | term moved across without changing sign | `3x−6 = x+4 → 3x−x = 4−6` |
| `OPERACIO_INVERSA` | subtracts/adds the coefficient instead of dividing | `2x = −2 → x = −4` |
| `COEFICIENT_OBLIDAT` | the coefficient vanishes without dividing | `3x = 12 → x = 12` |
| `DIVISIO_SIGNE` | divides by the absolute value of a negative coefficient | `−3x = 9 → x = 9/3` |
| `QUOCIENT_INVERTIT` | divides the wrong way round | `9x = 5 → x = 9/5` |
| `SUMA_ABANS_PRODUCTE` | number before the bracket added to its factor | `3 + 2·(x − 4) → 5·(x − 4)` or `→ 5x − 4` The `5x − 4` variant is **deactivated** (survey 28/11, `SUMA_ABANS_PRODUCTE:x`). |
| `INVERS_X` | x in the denominator: multiplies instead of dividing | `30/x = 5 → x = 30·5` |
| `CANVI_SIGNE_PARCIAL` | changing every sign, one term forgotten | `−4x + 5 − 3x = 6 − x → 4x − 5 + 3x = 6 + x` **Deactivated** (survey 28/11, `DESACTIVADES`). |
| `DENOMINADORS` | clearing denominators: sign before a fraction / terms not multiplied | `(3x + 5)/2 − (x − 4)/3 = 5x → 9x + 15 − 2x − 8 = 30x` |
| `DIST_SUMA` | outer factor added to the inner coefficient | `−2·(3x + 6) → −5x − 12` **Deactivated** (survey 28/11, `DESACTIVADES`). |
| `COEFICIENT_U` | a lone x is not counted | `3x + x + 6x → 9x` |
| `SIGNE_COPIAT` | a term only copied in this step changes sign | `9x + 7 = 3x − 23 → 9x − 3x = 23 − 7` |
| `TERMES_NO_SEMBLANTS` | adds unlike terms | `2x + 3 → 5x`; `2x + 3 + 4x → 9x` |
| `CALCUL` | sign slip adding two terms (one negative) | `−3 + 15 → −12` or `−18` |

`TERMES_NO_SEMBLANTS` replaces the `tra` step and the pupil then transposes what is left
(`2x + 6 = x + 10 → 8x = x + 10 → 8x − x = 10 …`); its red1 variant merges a whole side with ≥ 2 x-terms
and a number into one x-term (`2x + 3 + 4x = 18 → 9x = 18`, David's comment on B16). `SIGNE_COPIAT`
(comments on B05 and B15) and the realistic `CALCUL` values (comment on B07: a pupil writes −12 or −18 for
−3 + 15, never 10) were added after bank batch 1; `DIST_SUMA` and `COEFICIENT_U` come from the real errors David wrote in batch 2
(with the level-2 statement form H, a coefficient inside the bracket). The README has the generator's real rule table.

### 5.3 Generation algorithm (pure, seeded — fixed sessions must be reproducible)

1. Generate a statement for the level and the pupil's correct procedure (`resol`: den, exp, neg, red1, tra, red2,
   inv, div, simp; each only when it changes something).
   The `operacions` engine was not reused: its steps (move and simplify in one go) are not the lines a pupil writes.
2. Choose `k` transitions (k = 1 or 2 by level; 0 only with `noerrors=1`) and a mal-rule applicable to each.
3. Apply the mal-rule to that transition; **recompute every later line correctly from the wrong line**.
4. Validate: (a) every non-injected transition is a valid equivalence (same solution set, checked with exact
   rationals); (b) every injected transition is **not** valid; (c) the injected line is not accidentally
   equal to another valid transformation of the previous line; (d) numbers stay in the level's range;
   (e) N4 (compensating): exactly two invalid transitions **and** final solution = true solution.
5. Build texts (`expl`, `correctes`, `perque`, `opcions`) from templates per mal-rule/step type.

### 5.4 Order of operations (David, 2026-11-25: done before stages 3–4)

Same example format, same engine (`js/motor/*`), same levels (`js/equacions/nivells.js`, `forma` 1 for level 1
and 2 for levels 2–5). N1 becomes: a line is an error if its **value** differs from the line above. The statement
has no «=»; every other line starts with «=» (the notebook aligns them). The pupil does one level per line
(brackets → powers → first `·`/`:` of every chain → first `+`/`−`). Mal-rules (ids map to `errors-prioritat.json`;
the README has examples and sources):

| id | Wrong step | Example |
|---|---|---|
| `ESQUERRA_DRETA` | left to right, ignoring precedence | `6 + 5 · 2 → 11 · 2` |
| `SUMA_ABANS_RESTA` | addition before a subtraction on its left | `10 − 3 + 2 → 10 − 5` |
| `PRODUCTE_ABANS_DIVISIO` | multiplication before a division on its left | `24 : 2 · 3 → 24 : 6` |
| `PARENTESI_IGNORAT` | the factor multiplies only the first number in the bracket | `2 · (11 − 1) → 22 − 1` **Deactivated** (survey 28/11, `DESACTIVADES`). |
| `POTENCIA_PER_EXPONENT` | base times exponent, in every power of the step | `3^2 → 6` |
| `POTENCIA_DESPRES` | multiplies before the power | `2 · 3^2 → 6^2` |
| `RESTA_NEGATIVA` | negative difference written positive | `15 − 27 → 12` |
| `RESTA_GIRADA` | product done, moved to the front, subtraction reversed (David's pupil, 27/11/2026) | `3 − 8 · 5 → 40 − 3` |
| `SIGNE_PRODUCTE` | sign rule of the product ignored | `(−8) · 8 → 64` |

## 6. Levels and URL parameters

| nivell | Content (R5 applied) |
|---|---|
| 1 | one error, announced, 4–6 lines, no brackets (forms A, B, G, I) |
| 2 | one error, announced, 6–8 lines, brackets (forms C, D, E, F, H, K, L) |
| 3 | one error, not announced (with `noerrors=1`: zero or one) |
| 4 | two errors, announced |
| 5 | one or two, not announced (with `noerrors=1`: zero to two); compensating pairs allowed |

Parameters (`js/motor/parametres.js`, both activities; the index sets every one): `nivell`, `noerrors` (R5),
`escriu`, `encercla` (R3; absent = circle on touch screens, tap with a mouse), `totaloperations`, `maxintents`
(default 3), `llavor` (same examples for everyone), `membre` (equations only: membre, costat, banda or part, the
word used in the «Per què?» sentences). Not yet: `totalsessions`, `fixed`, verification code (stage 3).

## 7. Interaction (as prototyped)

- States per example: `busca` → (hit) `terme` → `perque` → `corregeix` → `busca` (if errors remain) → `fi`.
  The `terme` phase runs at every level (David 26/11/2026); each correct term chosen there, or enclosed with the
  line, is a failed attempt; at `maxintents` the term is shown and the example is worth 0.
- Hit with a lasso that enclosed exactly the wrong term: «Molt bé, has localitzat la línia i el terme on hi ha l'errada.» (all fixed texts were rewritten by David on 2026-11-27; they live in the code)
- After the last error (announced count): band «Molt bé!» or «T'he ensenyat l'errada» with the points, and «Següent» (Enter).
  With unannounced count the student must press «No hi ha cap més errada» / «No hi ha cap errada».
- Messages: second person singular, Catalan, short, with TeX for maths (David's caption rules in
  `pau/procediments/INSIGHTS.md` §3).

## 8. Visual rules

- Notebook only (P1): squared paper, pupil ink blue, Patrick Hand; lines aligned at «=» (R4); line numbers (P2).
- Teacher layer (R1/R2): red, correction typeface; pencil-grey ✓ for confirmed correct lines.
- Student layer (R1): palette from R1 for messages, chips and the final band; never red/green alone.
- Hover rule on every clickable control (David): black thick border + light grey background, no shift.
- Targets: Chromebooks and Lenovo laptops first, then iPads/Android tablets; phones secondary but no
  horizontal overflow at 360 px.

## 9. Stages (R8, approved)

1. **DONE 2026-11-25.** Repo skeleton, `errors.json`, equation generator + mal-rules + tests, page with notebook, tap +
   «Comprova», keyboard, F1/F3, «Per què?», «Corregeix-la» (choice), points.
2. **DONE 2026-11-25.** Five levels, two errors, compensating pairs, `noerrors`,
   term phase (R4), curated bank mechanism + first batch for review (R6), typed correction (`escriu=1`, chosen by
   the teacher; the student types only the circled term, corrected — David, 2026-11-25).
3. Verification code `LE` + analyser support in `operacions`.
4. Projector mode.
5. **DONE 2026-11-25 (before 3 and 4, David's order).** Lasso (R3): `js/motor/llac.js`, `encercla` parameter.
6. «Caça l'errada del solucionari» inside `step-quiz/sol`.
7. **Order of operations DONE 2026-11-25** (`prioritat.html`, §5.4). Fractions still to do (reuse
   `operacions/js/fraccions/errors-fraccions.js` diagnoses).

## 10. Tests (minimum)

- Generator, over ≥ 1000 seeds per level: §5.3 validations; no `undefined`/`NaN` in any text; fixed sessions
  give identical fingerprints.
- State machine: ladder (1st/2nd/3rd miss), scoring floor, phases, two-error flow, unannounced flow.
- Lasso geometry: enclosed term, two-line ambiguity, too-small stroke, open underline.
- Browser smoke test (Playwright, 1366×768 and 360×740 touch): a full example by tap, by keyboard and by lasso.
