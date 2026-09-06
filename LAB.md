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
| 15  | `givesStalemate` (−1)                |   1479 |           +19 |
| 16  | `captureValue` (25) _(Goat)_         |   1465 |            +5 |
| —   | `material` (bare)                    |   1460 |             0 |
| 17  | `symmetryMirrorY` (15) _(Parrot)_    |   1440 |           −20 |
| 18  | `sameColorSquares` (15) _(Elephant)_ |   1436 |           −24 |
| 19  | `kingProximity` (−20)                |   1279 |          −181 |

## What sits below material

Everything at or below the anchor is load-bearing and was never a "beats material" bet:

- **`symmetryMirrorY`, `sameColorSquares`, `kingProximity`** each back a paper animal — the
  Parrot, the Elephant, and the suicide-king the roster has not drawn yet (`kingProximity` at
  this sign _is_ `suicide_king`: −181 is the personality working, not failing). Kept for the same
  reason `givesStalemate` is: it lets a bot tell mate from stalemate, which the paper calls out
  `min_oppt_moves` for missing.
- **`captureValue`, `pushDepth`, `givesCheck`** are the Goat (the paper's `cccp`), which cannot
  be expressed without them.

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
  9–16 are statistically the same bot as the anchor, ordered by luck as much as merit.
- **`centralization` holds its top-three place** from the last pass — the role-agnostic
  piece-square stand-in carries strength the twelve per-role sliders it replaced never showed.
- **Forcing and structure features fire too rarely** at depth 2 to separate from material with
  one weight. They are kept where a specific animal needs them, not for their rating here.
- **Caveat:** one weight per feature, and the sign hand-picked. A feature at the noise floor may
  be mistuned rather than weak — a real verdict needs a weight sweep, which the SPSA tuner is for.

## Depth 3 and two-weight combos (seed 1, lab-only)

Several runs, all `base: "material"`, `temperature: 0`. Bare `material` at depth 3 is the anchor
(1376–1410 ±30 across runs — that spread is run-to-run noise on one bot).

**A ply outweighs any depth-2 feature stack.** Bare `material` at depth 3 beat every depth-2
stack: 60/40 vs `offeredMaterial`+`mobility`, 55/45 vs a four-feature stack, 70/30 vs six. Past
~4 weights the argmax gets noisier, not sharper — the six-stack was worst.

**At equal depth (3), a prophylaxis combo is worth ~+220 Elo; a bad combo costs you.**
Feature-disjoint pairs, H2H vs bare `material` at depth 3:

| combo (weights)                        | rating | H2H           |
| -------------------------------------- | -----: | ------------- |
| `offeredMaterial` −20 + `mobility` 10  |   1626 | 82/18         |
| `hanging` −100 + `centralization` 8    |   1603 | 73/27         |
| `offeredMaterial` −20 + `hanging` −100 |   1599 | 76/24         |
| `centralization` 8 + `space` 6         |   1522 | 70/30         |
| `opponentMobility` −8 + `mobility` 10  |   1503 | 69/31         |
| `kingAttackers` −40 + `space` 6        |   1362 | 42/58 (loses) |

- **Every combo with `offeredMaterial` or `hanging` lands ~1600** and the top three are within a
  CI — so `offeredMaterial`+`hanging` (double "don't lose material") is as strong as the
  `offeredMaterial`+`mobility` standout. Prophylaxis is the whole story.
- **Two positional features are a tier below** (~1510) — real but not super-strong, and stacking
  two of them buys ~nothing over one (a separate run had `mob`+`cent`, `space`+`cent`,
  `ctrl`+`space` all tied with bare `centralization`).
- **`swarm` only works solo** — `swarm`+`mobility` and `swarm`+`kingAttackers` both rated below
  the anchor; two "charge the king" signals just hang the army.
- **`kingAttackers` is already the attacker at its negative weight** (the feature is
  ours-minus-theirs king pressure). `+40` would be `suicide_king`, not aggression.

### Graduated to the roster

Three of these pairs became depth-3 animals: `offeredMaterial`+`hanging` → **Hare**,
`centralization`+`space` → **Bear**, `mobility`+`opponentMobility` → **Rhino**. On the full
roster they rank 2nd, 3rd and 4th. First is the **Raven** — plain material at depth 3 with
`quiescence` on, no weights — which beats the Hare ~9-in-10: resolving the capture chain past the
leaf is worth more than any pair of weights, because the one blunder a material search makes is
taking a piece that is recaptured. The Owl (depth 3, no quiescence, no weights) is 5th.
