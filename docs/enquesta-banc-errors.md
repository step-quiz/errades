# Department survey of the teachers' review page (`banc-errors.html`, code format `BANC-ERRORS v3`)

**Closed on 2026-11-28 with 8 answers** (David's file `__enquesta__errades.docx`; the 27/11 version of this file had 4).
Anonymous. Item numbers are those of `banc-errors.html` v3 (equations 1–20, order of operations 21–28);
`node eines/banc-errors.mjs` prints the numbered list. The page itself computes this tally at `banc-errors.html#resultats`.
Weights (David): MM +3, M +2, not rated 0, N −4. Maximum 24, minimum −32.

## Tally and score

| Item | Type | Example | MM | M | N | - | Points |
|---|---|---|---|---|---|---|---|
| 1 | `DISTRIBUTIVA` | Propietat distributiva | 5 | 3 | 0 | 0 | 21 |
| 2 | `DIST_SIGNE` | Signe davant d'un parèntesi | 8 | 0 | 0 | 0 | 24 |
| 3 | `SUMA_ABANS_PRODUCTE` | La suma abans que el producte (suma abans de multiplicar) | 1 | 6 | 0 | 1 | 15 |
| 4 | `SUMA_ABANS_PRODUCTE` | La suma abans que el producte (i, a més, només multiplica la x) | 0 | 4 | 3 | 1 | **-4** |
| 5 | `DIST_SUMA` | Suma en lloc de multiplicar | 0 | 1 | 6 | 1 | **-22** |
| 6 | `SIGNE_TRANSPOSAR` | Signe en passar un terme | 4 | 3 | 1 | 0 | 14 |
| 7 | `SIGNE_COPIAT` | Signe copiat malament | 7 | 1 | 0 | 0 | 23 |
| 8 | `TERMES_NO_SEMBLANTS` | Termes no semblants | 1 | 6 | 0 | 1 | 15 |
| 9 | `COEFICIENT_U` | La x sola no es compta | 3 | 4 | 0 | 1 | 17 |
| 10 | `CALCUL` | Error de càlcul amb signes | 2 | 5 | 0 | 1 | 16 |
| 11 | `OPERACIO_INVERSA` | Operació inversa | 5 | 1 | 1 | 1 | 13 |
| 12 | `COEFICIENT_OBLIDAT` | Coeficient oblidat | 1 | 4 | 1 | 2 | 7 |
| 13 | `DIVISIO_SIGNE` | Signe en dividir | 7 | 1 | 0 | 0 | 23 |
| 14 | `QUOCIENT_INVERTIT` | Divisió al revés | 4 | 4 | 0 | 0 | 20 |
| 15 | `QUOCIENT_INVERTIT` | Divisió al revés (cas bessó) | 5 | 3 | 0 | 0 | 21 |
| 16 | `INVERS_X` | La x al denominador | 4 | 3 | 0 | 1 | 18 |
| 17 | `CANVI_SIGNE_PARCIAL` | Canvi de signe incomplet (un terme de la dreta) | 2 | 2 | 2 | 2 | **2** |
| 18 | `CANVI_SIGNE_PARCIAL` | Canvi de signe incomplet (un terme de l'esquerra) | 2 | 2 | 2 | 2 | **2** |
| 19 | `DENOMINADORS` | Treure denominadors (el signe de davant de la fracció) | 8 | 0 | 0 | 0 | 24 |
| 20 | `DENOMINADORS` | Treure denominadors (els termes sense denominador) | 7 | 0 | 0 | 1 | 21 |
| 21 | `ESQUERRA_DRETA` | D'esquerra a dreta | 7 | 1 | 0 | 0 | 23 |
| 22 | `SUMA_ABANS_RESTA` | La suma abans que la resta | 5 | 2 | 1 | 0 | 15 |
| 23 | `PRODUCTE_ABANS_DIVISIO` | La multiplicació abans que la divisió | 6 | 2 | 0 | 0 | 22 |
| 24 | `PARENTESI_IGNORAT` | Parèntesi oblidat | 0 | 5 | 2 | 1 | **2** |
| 25 | `POTENCIA_PER_EXPONENT` | Potència com a multiplicació | 5 | 3 | 0 | 0 | 21 |
| 26 | `POTENCIA_DESPRES` | La multiplicació abans que la potència | 4 | 3 | 1 | 0 | 14 |
| 27 | `RESTA_NEGATIVA` | Resta amb resultat negatiu | 3 | 5 | 0 | 0 | 19 |
| 28 | `SIGNE_PRODUCTE` | Signe d'un producte | 5 | 3 | 0 | 0 | 21 |

## Decision (David, 2026-11-28)

Remove from the site every situation with **two or more N**: items 4, 5, 17, 18 and 24. They are also exactly the
items with 2 points or fewer (the next one, item 12, has 7). David chose, in the dialog:
- **Deactivate, not delete:** `DESACTIVADES` in `js/equacions/generador.js` (`DIST_SUMA`, `CANVI_SIGNE_PARCIAL`,
  `SUMA_ABANS_PRODUCTE:x`) and in `js/prioritat/generador.js` (`PARENTESI_IGNORAT`). The generators skip them (also
  as «Corregeix-la» options) and `encaixaBanc` skips bank examples of those types (lot3-D06, D07, D08: `DIST_SUMA`).
- **Item 4 is only a variant:** `SUMA_ABANS_PRODUCTE` stays with the `5·(x − 4)` variant (item 3, 15 points); the
  `5x − 4` variant is off.
- **Item 24 removed**, although a comment suggested fixing it (no bracket starting with 1).

## Comments (verbatim)

- **1** (Propietat distributiva), answer 1, MM: «podem afegir un altre cas, que de vegades l'errada es comet quan hi ha més d'informació, per exemple: "2x+6(x-3)=-24" -> "2x+6x-3=-24"»
- **4** (La suma abans que el producte (i, a més, només multiplica la x)), answer 8, N: «Jo potser m'he trobat més casos on sumen els termes amb x i sense de dins del parèntesi»
- **5** (Suma en lloc de multiplicar), answer 5, N: «No m'agrada que s'equivoqui en sumar -2+3x (enlloc de multiplicar) però faci bé el producte -2*6»
- **19** (Treure denominadors (el signe de davant de la fracció)), answer 8, MM: «Aquest, per a mi, és el top»
- **22** (La suma abans que la resta), answer 2, N: «I es poden sumar tots els positius i després els negatius 10-2»
- **24** (Parèntesi oblidat), answer 2, N: «El veig una mica lio, perquè pots pensar que el que ha fet malament només és la suma de dintre del parèntesi, i si enlloc de l'1 es posa un altre nombre? 14-6. (2-12)»

## Open ideas from the comments

- Item 1: a distributive case with a term before the bracket, `2x + 6(x − 3) = −24 → 2x + 6x − 3 = −24`.
- Item 22: a teacher says adding all positives and then all negatives is valid; check that the example is not
  read that way before changing anything.
