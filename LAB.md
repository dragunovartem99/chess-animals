# LAB.md

What the bench in [`cli/lab.ts`](./cli/lab.ts) has turned up. Every candidate here is `base: "material"`,
`depth: 2`, `temperature: 0`, one weight over the top — the shape `lab()` builds.

Re-run with `npm run arena -- --lab-only --seed=1` (candidates play each other, roster left out).

## Broad-feature ranking (seed 1)

One hand-picked weight per feature (~1 pawn of influence, sign matching its meaning), rated
lab-only. The scale is self-referential and compressed; the **anchors** map it onto the roster —
`mobility` is the Spider, `hanging` the Hedgehog, `kingAttackers` the Hawk, bare `material` the
Monkey.

| #   | feature                  | weight | rating | Δ vs material |
| --- | ------------------------ | -----: | -----: | ------------: |
| 1   | `offeredMaterial`        |    −20 |   1669 |          +222 |
| 2   | `mobility` _(Spider)_    |     10 |   1644 |          +197 |
| 3   | `safeMobility`           |     10 |   1629 |          +182 |
| 4   | `space`                  |      6 |   1562 |          +115 |
| 5   | `hanging` _(Hedgehog)_   |   −100 |   1561 |          +114 |
| 6   | `swarm`                  |    −40 |   1550 |          +103 |
| 7   | `centerControl`          |     30 |   1516 |           +69 |
| 7   | `kingAttackers` _(Hawk)_ |    −40 |   1516 |           +69 |
| 9   | `pushDepth`              |     15 |   1472 |           +25 |
| 10  | `givesCheck`             |     40 |   1469 |           +22 |
| 11  | `opponentMobility`       |     −8 |   1466 |           +19 |
| 11  | `kingOpenFile`           |    −35 |   1466 |           +19 |
| 13  | `captureValue`           |     25 |   1460 |           +13 |
| 14  | `pawnPassed`             |     35 |   1457 |           +10 |
| 15  | `tempo`                  |     25 |   1450 |            +3 |
| —   | `material` (bare)        |      — |   1447 |             0 |
| 16  | `kingRingDefenders`      |     15 |   1392 |           −55 |
| 17  | `kingProximity`          |    −30 |   1274 |          −173 |

## Reading it

- **Mobility-shaped features win.** `mobility`, `safeMobility`, `space` and `offeredMaterial`
  (which is "don't hand the opponent moves-plus-material") are the top four — dense signals that
  nudge almost every quiet move toward a better position and away from tactics.
- **`offeredMaterial` beats plain `mobility`** at these weights and is not read by any animal —
  the strongest single-weight candidate found so far.
- **`swarm` helps, `kingProximity` hurts.** Marching the army at the enemy king is worth ~100;
  marching your own king at theirs is worth −170.
- **Forcing/structure features barely move the needle** at depth 2: a passed pawn, a check, a
  capture bonus are all within noise of bare material. They fire too rarely to matter.
- **Caveat:** one weight per feature. A feature near zero here (`tempo`, `kingRingDefenders`) may
  be mistuned rather than weak — a real verdict needs a weight sweep. Piece-specific features
  (per-role centralization, outpost, rook-on-seventh…) are deliberately not on this list; see the
  toolkit row in [PLAN.md](./PLAN.md).
