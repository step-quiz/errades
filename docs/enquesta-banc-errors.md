# Department survey of the teachers' review page (`banc-errors.html`, code format `BANC-ERRORS v3`)

Received from David on 2026-11-27. **4 of 6 teachers have answered; 2 answers are still missing.** The survey is
anonymous (no names in the codes). Item numbers are the ones of `banc-errors.html` v3: equations 1–20, order of
operations 21–28. To see which example each number is, run `node eines/banc-errors.mjs`, which prints the
numbered list (it also regenerates `banc-errors.html`; do not commit that file unless it changed on purpose).

## Tally (MM = m'agrada molt · M = m'agrada · N = no m'agrada · - = not rated)

| Item | MM | M | N | - |
|---|---|---|---|---|
| 1 | 2 | 2 | 0 | 0 |
| 2 | 4 | 0 | 0 | 0 |
| 3 | 0 | 4 | 0 | 0 |
| 4 | 0 | 2 | 1 | 1 |
| 5 | 0 | 1 | 3 | 0 |
| 6 | 2 | 2 | 0 | 0 |
| 7 | 4 | 0 | 0 | 0 |
| 8 | 1 | 3 | 0 | 0 |
| 9 | 1 | 2 | 0 | 1 |
| 10 | 1 | 2 | 0 | 1 |
| 11 | 1 | 1 | 1 | 1 |
| 12 | 0 | 2 | 1 | 1 |
| 13 | 4 | 0 | 0 | 0 |
| 14 | 2 | 2 | 0 | 0 |
| 15 | 3 | 1 | 0 | 0 |
| 16 | 2 | 1 | 0 | 1 |
| 17 | 1 | 1 | 1 | 1 |
| 18 | 1 | 1 | 1 | 1 |
| 19 | 4 | 0 | 0 | 0 |
| 20 | 4 | 0 | 0 | 0 |
| 21 | 4 | 0 | 0 | 0 |
| 22 | 2 | 1 | 1 | 0 |
| 23 | 2 | 2 | 0 | 0 |
| 24 | 0 | 1 | 2 | 1 |
| 25 | 2 | 2 | 0 | 0 |
| 26 | 2 | 2 | 0 | 0 |
| 27 | 0 | 4 | 0 | 0 |
| 28 | 2 | 2 | 0 | 0 |
**Items with at least one N:** 5 (3 N, the clearest rejection), 24 (2 N), 4, 11, 12, 17, 18 and 22 (1 N each).
**Unanimous MM:** 2, 7, 13, 19, 20 and 21.

## Weighted ranking (David's weights, 2026-11-27)

Points per vote: MM (m'agrada molt) +3 · M (m'agrada) +2 · «-» (not rated, taken as *indiferent*) 0 · N (no
m'agrada) −4. Score = sum over the answers. With 4 answers the maximum is 12. Ties share a rank and are listed by
item number. **Recompute when the 2 missing answers arrive** (the maximum becomes 18).

### Equations (items 1–20)

| Rank | Item | Points | MM | M | N | - |
|---|---|---|---|---|---|---|
| 1 | 2 | 12 | 4 | 0 | 0 | 0 |
| 1 | 7 | 12 | 4 | 0 | 0 | 0 |
| 1 | 13 | 12 | 4 | 0 | 0 | 0 |
| 1 | 19 | 12 | 4 | 0 | 0 | 0 |
| 1 | 20 | 12 | 4 | 0 | 0 | 0 |
| 6 | 15 | 11 | 3 | 1 | 0 | 0 |
| 7 | 1 | 10 | 2 | 2 | 0 | 0 |
| 7 | 6 | 10 | 2 | 2 | 0 | 0 |
| 7 | 14 | 10 | 2 | 2 | 0 | 0 |
| 10 | 8 | 9 | 1 | 3 | 0 | 0 |
| 11 | 3 | 8 | 0 | 4 | 0 | 0 |
| 11 | 16 | 8 | 2 | 1 | 0 | 1 |
| 13 | 9 | 7 | 1 | 2 | 0 | 1 |
| 13 | 10 | 7 | 1 | 2 | 0 | 1 |
| 15 | 11 | 1 | 1 | 1 | 1 | 1 |
| 15 | 17 | 1 | 1 | 1 | 1 | 1 |
| 15 | 18 | 1 | 1 | 1 | 1 | 1 |
| 18 | 4 | 0 | 0 | 2 | 1 | 1 |
| 18 | 12 | 0 | 0 | 2 | 1 | 1 |
| 20 | 5 | -10 | 0 | 1 | 3 | 0 |

### Order of operations (items 21–28)

| Rank | Item | Points | MM | M | N | - |
|---|---|---|---|---|---|---|
| 1 | 21 | 12 | 4 | 0 | 0 | 0 |
| 2 | 23 | 10 | 2 | 2 | 0 | 0 |
| 2 | 25 | 10 | 2 | 2 | 0 | 0 |
| 2 | 26 | 10 | 2 | 2 | 0 | 0 |
| 2 | 28 | 10 | 2 | 2 | 0 | 0 |
| 6 | 27 | 8 | 0 | 4 | 0 | 0 |
| 7 | 22 | 4 | 2 | 1 | 1 | 0 |
| 8 | 24 | -6 | 0 | 1 | 2 | 1 |

## Comments, verbatim (Catalan)

- **Teacher 1, item 1 (MM):** «podem afegir un altre cas, que de vegades l'errada es comet quan hi ha més d'informació, per exemple: "2x+6(x-3)=-24" -> "2x+6x-3=-24"». This asks for a DISTRIBUTIVA case with a term before the bracket. Check whether the generator already produces it.
- **Teacher 2, item 22 (N):** «I es poden sumar tots els positius i després els negatius 10-2». The pupil may legitimately add all positives and then all negatives. Check that the example does not mark a valid order as wrong.
- **Teacher 2, item 24 (N):** «El veig una mica lio, perquè pots pensar que el que ha fet malament només és la suma de dintre del parèntesi, i si enlloc de l'1 es posa un altre nombre? 14-6. (2-12)». The example is ambiguous about where the error is; the teacher suggests different numbers.

## Raw codes, as received

```
BANC-ERRORS v3
1 MM | podem afegir un altre cas, que de vegades l'errada es comet quan hi ha més d'informació, per exemple: "2x+6(x-3)=-24" -> "2x+6x-3=-24"
2 MM
3 M
4 M
5 N
6 MM
7 MM
8 M
9 -
10 M
11 MM
12 M
13 MM
14 M
15 MM
16 MM
17 MM
18 MM
19 MM
20 MM
21 MM
22 MM
23 MM
24 N
25 MM
26 MM
27 M
28 MM
FI

BANC-ERRORS v3
1 M
2 MM
3 M
4 M
5 M
6 M
7 MM
8 M
9 MM
10 M
11 M
12 M
13 MM
14 MM
15 MM
16 MM
17 M
18 M
19 MM
20 MM
21 MM
22 N | I es poden sumar tots els positius i després els negatius 10-2
23 MM
24 N | El veig una mica lio, perquè pots pensar que el que ha fet malament només és la suma de dintre del parèntesi, i si enlloc de l'1 es posa un altre nombre? 14-6. (2-12)
25 M
26 MM
27 M
28 MM
FI

BANC-ERRORS v3
1 MM
2 MM
3 M
4 -
5 N
6 M
7 MM
8 M
9 M
10 -
11 -
12 -
13 MM
14 M
15 M
16 -
17 -
18 -
19 MM
20 MM
21 MM
22 MM
23 M
24 -
25 M
26 M
27 M
28 M
FI

BANC-ERRORS v3
1 M
2 MM
3 M
4 N
5 N
6 MM
7 MM
8 MM
9 M
10 MM
11 N
12 N
13 MM
14 MM
15 MM
16 M
17 N
18 N
19 MM
20 MM
21 MM
22 M
23 M
24 M
25 MM
26 M
27 M
28 M
FI
```
