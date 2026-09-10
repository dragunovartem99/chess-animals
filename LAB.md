# LAB.md

What the bench in [`cli/lab.ts`](./cli/lab.ts) has measured. Re-run with
`npm run arena -- --lab-only --seed=1`.

Weights are in **today's** signs: `swarm`, `huddle` and `kingProximity` were negated after these
runs, and `kingDanger` was `kingAttackers`. Same bots, same ratings — only the number you would
type to rebuild one has changed.

## One weight per feature, depth 2

`base: "material"`, one hand-picked weight worth roughly a pawn of influence. Bare `material`
anchors at **1460** with ±12 CIs, so a paired difference under ~35 Elo is noise. `givesMate` is
omitted — the base pins it. Piece-value nudges were swept separately and only confirmed the frozen
numbers.

| feature (weight)                     | rating |    Δ |
| ------------------------------------ | -----: | ---: |
| `offeredMaterial` (−20)              |   1697 | +237 |
| `mobility` (10) _(Spider)_           |   1653 | +193 |
| `centralization` (8)                 |   1614 | +154 |
| `hanging` (−100) _(Hedgehog)_        |   1590 | +130 |
| `space` (6)                          |   1587 | +127 |
| `swarm` (40)                         |   1561 | +101 |
| `kingDanger` (−40)                   |   1539 |  +79 |
| `centerControl` (30)                 |   1536 |  +76 |
| _noise floor — below here Δ ≈ 0_     |        |      |
| `givesCheck` (40) _(Goat)_           |   1496 |  +36 |
| `pushDepth` (15) _(Goat)_            |   1490 |  +30 |
| `opponentMobility` (−8)              |   1482 |  +22 |
| `huddle` (40) _(Sloth)_              |   1482 |  +22 |
| `givesStalemate` (−1)                |   1479 |  +19 |
| `captureValue` (25) _(Goat)_         |   1465 |   +5 |
| `material` (bare)                    |   1460 |    0 |
| `mirrorRanks` (15) _(Parrot)_        |   1440 |  −20 |
| `sameColorSquares` (15) _(Elephant)_ |   1436 |  −24 |
| `kingProximity` (20) _(Dodo)_        |   1279 | −181 |

- **Only the top eight beat bare material.** Dense signals that nudge almost every quiet move.
  Below `centerControl` the field is one CI wide, ordered by luck as much as merit.
- **Below the anchor is load-bearing, not weak.** `mirrorRanks`, `sameColorSquares` and
  `kingProximity` _are_ the Parrot, the Elephant and the Dodo — −181 is `suicide_king` working,
  not failing. `captureValue`, `pushDepth` and `givesCheck` are the Goat. `givesStalemate` is what
  lets a bot tell mate from stalemate, which the paper faults `min_oppt_moves` for missing.
- **Caveat:** one weight, hand-picked sign. A feature at the floor may be mistuned rather than
  weak — a real verdict needs the SPSA tuner.

## Two weights at depth 3

A ply outweighs any depth-2 stack: bare `material` at depth 3 beat the best depth-2 pair 60/40 and
a six-weight stack 70/30. Past ~4 weights the argmax gets noisier, not sharper.

At equal depth, pairs fall into three tiers against bare `material`. **Prophylaxis is the whole
story** — any pair holding `offeredMaterial` or `hanging` lands ~1600 and 75–82/18–25, the top
three inside one CI. Two positional features are a tier below at ~1510 — `centralization` with
`space`, or `mobility` with `opponentMobility` — and stack to ~nothing over one.
`kingDanger`+`space` is the one pair that _loses_ to the anchor, 42/58.

## Three weights at depth 3 + quiescence

2,800 games, ~79 min. `lab-quiet` is the bare Raven build.

| candidate   | weights                                            |   rating | vs `lab-quiet` |
| ----------- | -------------------------------------------------- | -------: | -------------- |
| `lab-msc`   | `mobility` 10 + `space` 6 + `centralization` 8     | 1738 ±26 | 91.5/8.5       |
| `lab-sms`   | `swarm` 40 + `mobility` 10 + `space` 6             | 1681 ±24 | 86/14          |
| `lab-smf`   | `swarm` 40 + `mobility` 10 + `offeredMaterial` −20 | 1615 ±23 | 82/18          |
| `lab-mks`   | `mobility` 10 + `kingDanger` −40 + `space` 6       | 1516 ±23 | 84.5/15.5      |
| `lab-smk`   | `swarm` 40 + `mobility` 10 + `kingDanger` −40      | 1484 ±23 | 81.5/18.5      |
| `lab-skc`   | `swarm` 40 + `kingDanger` −40 + `centerControl` 30 | 1456 ±23 | 74/26          |
| `lab-quiet` | —                                                  | 1284 ±25 | —              |
| `lab-smo`   | `swarm` 40 + `mobility` 10 + `opponentMobility` −8 | 1227 ±28 | 38.5/61.5      |

- **Bare quiescence is rudderless once everyone has it.** The exact Raven build, #1 on the full
  roster, finished 7th of 8 here: knowing a good square from a bad one is all that is left, and
  material knows nothing.
- **`swarm` works at depth 3 once quiescence is on**, reversing the no-quiescence verdict that it
  only works solo. Resolving the captures past the leaf is what stops the charge being suicide.
- **Doubling the king-charge still costs you** — `swarm` + `kingDanger` sank to mid-table either
  way. **`opponentMobility` as a third weight is toxic**, the only candidate below bare material.
- **Caveat:** lab-only and self-referential to these eight. `1738` here is not `1738` on the
  roster.

## Cut on this evidence

- **`reverseStarting`** (+41) cleared the floor but never earned an animal, and walked both armies
  against every role's home squares — the registry's most expensive feature for one CI.
- **`kingPawnDistance`** (+30) sat inside the noise band, unweighted, at a pawn walk per node.

## Unclaimed

**`kingDanger`** (+79) is the best-rated feature with no animal on it. It pairs badly with
`swarm`, so its animal is a solo one.

## Graduated

`offeredMaterial`+`hanging` → **Hare**, `centralization`+`space` → **Bear**,
`mobility`+`opponentMobility` → **Rhino** (since cut to `opponentMobility` alone, the **Snake**), `swarm`+`mobility`+`space` → **Tiger** (chosen over the
higher-rated but personality-free `lab-msc`). The first three rank 2nd–4th on the full roster,
behind the **Raven** — depth 3 with quiescence and no weights — which beats the Hare ~9-in-10. The
Tiger's rank is still provisional.
