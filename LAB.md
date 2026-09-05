# LAB.md

What the bench in [`cli/lab.ts`](./cli/lab.ts) has turned up. Every candidate here is `base: "material"`,
`depth: 2`, `temperature: 0`, one weight over the top — the shape `lab()` builds.

Re-run with `npm run arena -- --lab-only --seed=1` (candidates play each other, roster left out).

## Broad-feature ranking (seed 1, 19 candidates)

One hand-picked weight per feature (~1 pawn of influence, sign matching its meaning), rated
lab-only against each other. The scale is self-referential and compressed; bare `material` is the
anchor at **1448**.

| #   | feature (weight)               | rating | Δ vs material |
| --- | ------------------------------ | -----: | ------------: |
| 1   | `offeredMaterial` (−20)        |      — |      strong + |
| 2   | `mobility` (10) _(Spider)_     |      — |      strong + |
| 3   | `centralization` (8)           |   1596 |          +148 |
| 4   | `hanging` (−100) _(Hedgehog)_  |   1567 |          +119 |
| 5   | `space` (6)                    |   1562 |          +114 |
| 6   | `centerControl` (30)           |   1523 |           +75 |
| 7   | `kingAttackers` (−40) _(Hawk)_ |   1515 |           +67 |
| 8   | `givesCheck` (40)              |   1485 |           +37 |
| 9   | `kingPawnDistance` (−15)       |   1473 |           +25 |
| 10  | `kingOpenFile` (−35)           |   1465 |           +17 |
| 11  | `opponentMobility` (−8)        |   1463 |           +15 |
| 12  | `captureValue` (25)            |   1459 |           +11 |
| 13  | `tempo` (25)                   |   1457 |            +9 |
| 14  | `pushDepth` (15)               |   1454 |            +6 |
| 15  | `pawnPassed` (35)              |   1451 |            +3 |
| —   | `material` (bare)              |   1448 |             0 |
| 16  | `pawnWeakness` (−30)           |   1435 |           −13 |
| 17  | `pawnAdvance` (advancement, 8) |   1424 |           −24 |
| 18  | `kingRingDefenders` (15)       |   1402 |           −46 |

## What this run cut

Every entry at or below bare material was removed from the registry (52 → 27):

- **`kingRingDefenders` (−46)** — a count of pieces standing near the king that never checked
  whether they defend anything. It taught the evaluation to keep its army home and lose. King
  safety is now `kingAttackers` + `kingOpenFile` + `kingPawnDistance`, nothing else.
- **The whole `pawns` family.** `pawnAdvance` (−24), `pawnWeakness` (−13) and `pawnPassed` (+3,
  noise) were the last three pawn-structure weights after an earlier pass folded doubled /
  isolated / backward / islands / connected / shield into one. None beat material. A pawn storm
  with no king-safety read just weakens you; a lumped weakness term fires too rarely at depth 2.
- **`tempo` (+9, noise)** — the registry's old "worked example". No bot ever set a weight on it.

Kept despite a noise-tier rating: `captureValue` and `pushDepth` — they are the Goat (the paper's
`cccp`), which cannot be expressed without them. `givesStalemate`, `symmetryMirrorY`,
`kingProximity` likewise each back a specific Elo World player and are not judged by "beats
material".

## Reading it

- **`centralization` is a top-three feature on its own** — the role-agnostic piece-square
  stand-in carries the strength the twelve per-role sliders it replaced never showed.
- **Mobility-shaped features win.** `mobility`, `space`, `offeredMaterial`, `centralization`,
  `hanging` are the top five — dense signals that nudge almost every quiet move toward a better
  position.
- **Forcing and structure features barely move the needle** at depth 2. They fire too rarely.
- **Caveat:** one weight per feature. A feature near zero here may be mistuned rather than weak —
  a real verdict needs a weight sweep.
