# LAB.md

What the bench in [`cli/lab.ts`](./cli/lab.ts) has turned up. Every candidate here is `base: "material"`,
`depth: 2`, `temperature: 0`, one weight over the top — the shape `lab()` builds.

Re-run with `npm run arena -- --lab-only --seed=1` (candidates play each other, roster left out).

## Full registry sweep (seed 1)

One hand-picked weight per feature (~1 pawn of influence, sign matching its meaning), rated
lab-only against each other. `givesMate` is omitted — the material base already pins it to 1, so
a candidate cannot move it. The five piece-value weights were swept too, as ±1-pawn nudges to the
base, and left out of the table: they are not cut candidates, and the run only confirmed the
frozen numbers — a rook bumped to 540 _lost_ 20 Elo, knight and queen bumps did nothing. The
scale is self-referential and compressed; bare `material` is the anchor at **1460**, and with
±12 CIs on every row a paired difference under ~35 Elo is noise.

| #   | feature (weight)                     | rating | Δ vs material |
| --- | ------------------------------------ | -----: | ------------: |
| 1   | `offeredMaterial` (−20)              |   1697 |          +237 |
| 2   | `mobility` (10) _(Spider)_           |   1653 |          +193 |
| 3   | `centralization` (8)                 |   1614 |          +154 |
| 4   | `hanging` (−100) _(Hedgehog)_        |   1590 |          +130 |
| 5   | `space` (6)                          |   1587 |          +127 |
| 6   | `swarm` (−40)                        |   1561 |          +101 |
| 7   | `kingAttackers` (−40) _(Hawk)_       |   1539 |           +79 |
| 8   | `centerControl` (30)                 |   1536 |           +76 |
| —   | _noise floor — below here Δ ≈ 0_     |        |               |
| 9   | `reverseStarting` (−20)              |   1501 |           +41 |
| 10  | `givesCheck` (40) _(Goat)_           |   1496 |           +36 |
| 11  | `kingPawnDistance` (−15)             |   1490 |           +30 |
| 12  | `pushDepth` (15) _(Goat)_            |   1490 |           +30 |
| 13  | `opponentMobility` (−8)              |   1482 |           +22 |
| 14  | `huddle` (−40) _(Turtle)_            |   1482 |           +22 |
| 15  | `kingOpenFile` (−35)                 |   1479 |           +19 |
| 16  | `givesStalemate` (−1)                |   1479 |           +19 |
| 17  | `captureValue` (25) _(Goat)_         |   1465 |            +5 |
| —   | `material` (bare)                    |   1460 |             0 |
| 18  | `isPromotion` (60)                   |   1459 |            −1 |
| 19  | `symmetryMirrorY` (15) _(Parrot)_    |   1440 |           −20 |
| 20  | `sameColorSquares` (15) _(Elephant)_ |   1436 |           −24 |
| 21  | `kingProximity` (−20)                |   1279 |          −181 |

## What this run says to cut

- **`isPromotion` (−1, noise) — cut, registry now 26.** Nothing set it — no base, no animal —
  and it could not: the value of queening already lands in the evaluation as the material swing
  on the move after. It was the `tempo` of this pass, a slot that reads a real event and changes
  no decision.

Everything else at or below `material` is load-bearing and not a "beats material" bet:

- **`symmetryMirrorY`, `sameColorSquares`, `kingProximity`** each back a paper animal — the
  Parrot, the Elephant, and the suicide-king the roster has not drawn yet (`kingProximity` at
  this sign _is_ `suicide_king`: −181 is the personality working, not failing). Kept for the same
  reason `givesStalemate` is: it lets a bot tell mate from stalemate, which the paper calls out
  `min_oppt_moves` for missing.

## What is working that no animal uses

- **`swarm` (+101)** is the strongest personality in the registry with no bot on it. The roster
  has the defensive half of the pair — `huddle`, the Turtle — but not the charge. A `swarm`
  animal is one data file.
- **`reverseStarting` (+41)** clears the noise floor on its own, more than a board-flip gimmick
  looked likely to.

## Reading it

- **Only the top eight beat bare material at depth 2.** `offeredMaterial`, `mobility`,
  `centralization`, `hanging`, `space`, `swarm`, `kingAttackers`, `centerControl` — dense signals
  that nudge almost every quiet move. Below `centerControl` the whole field is one CI wide: rows
  9–18 are statistically the same bot as the anchor, ordered by luck as much as merit.
- **`centralization` holds its top-three place** from the last pass — the role-agnostic
  piece-square stand-in carries strength the twelve per-role sliders it replaced never showed.
- **Forcing and structure features fire too rarely** at depth 2 to separate from material with
  one weight. They are kept where a specific animal needs them, not for their rating here.
- **Caveat:** one weight per feature, and the sign hand-picked. A feature at the noise floor may
  be mistuned rather than weak — a real verdict needs a weight sweep, which the SPSA tuner is for.
