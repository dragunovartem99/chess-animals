# LAB.md

What the bench in [`cli/lab.ts`](./cli/lab.ts) says about weights today. This file is the current
state, not a log: when a re-run changes a number, overwrite it.

## How to run it

Stage candidates in `cli/lab.ts` and run `npm run arena -- --lab-only`. Size the field by cost:

| search | field | wall time |  95% CI |
| ------ | ----: | --------: | ------: |
| d1, d2 |  ≤ 18 |      ~5 s |     ±45 |
| d3     |  ≤ 12 |      ~7 s |     ±55 |
| d3 + q |   6–7 |      ~4 s | ±60–140 |

The arena stops once the order is safe, so a bigger field gets fewer games per pair, not sharper
ratings. A d3 + q table orders its players; trust its gaps only when they exceed ~150.

A rating means something only inside its own run. Compare within one table, never across tables,
never against the roster's numbers. The same candidate moves ±50 between runs just from who else
is in the field.

## Method

Every candidate is `base: "material"` plus the weights under test, rated against bare `material`
at the **same search**. Change one thing at a time:

1. **Singles** — one feature at its known-best weight, per search.
2. **Pairs** drawn from the top singles of one search.
3. **The roster against its alternatives**, one tier at a time, with the current animal in the
   field.

## Observations

### 1. A feature helps only if it tells the search something it can't see

Material plus search already covers what the search reaches. A weight pays off when it brings in
knowledge from past the horizon; when it repeats what the search knows, it double-counts and
costs Elo.

### 2. Below quiescence, safety wins; with it, board control wins

Δ over bare `material`, same run:

| feature           |   d1 |   d2 |   d3 | d3 + q |
| ----------------- | ---: | ---: | ---: | -----: |
| `offeredMaterial` | +327 | +312 | +200 |   +251 |
| `hanging`         | +314 | +242 | +162 |   +162 |
| `mobility`        | −167 | +203 | +157 |   +532 |
| `centralization`  |  −12 | +170 | +173 |   +452 |
| `space`           |    — | +143 |    — |   +415 |

`offeredMaterial` and `hanging` stand in for the capture search a plain search lacks. Once
quiescence resolves the captures, activity features take over and carry the strongest bots.

### 3. At depth 1, reaching further is a liability

`mobility` at d1 is −167, `centralization` −12, `centerControl` +30. A piece that reaches further
also stands further out, and one ply can't see the recapture. Activity at d1 works only behind a
safety feature: `mobility` 10 + `offeredMaterial` −40 is +265. The Spider is `mobility` alone at
d1, and so the weakest material animal.

### 4. The deeper the search, the lighter the best weight

`offeredMaterial` −40 at d1, −20 at d2–d3, −10 with quiescence. `hanging` −50 beats −100 at d2.
`centralization` 8 beats 20 at d2. Obsession weights (`swarm` 600, `huddle` 550) sit 240–290
below bare material at d2. A deep search sees real material, and a heavy positional weight
overrules it.

### 5. Pairs work when the two features know different things

| search | best pair / triple                                     |    Δ |
| ------ | ------------------------------------------------------ | ---: |
| d1     | `offeredMaterial` −40 + `earlyQueen` −80 + `huddle` 40 | +459 |
| d1     | `hanging` −50 + `huddle` 40                            | +414 |
| d2     | `offeredMaterial` −20 + `swarm` 40                     | +364 |
| d2     | `offeredMaterial` −20 + `mobility` 10                  | +358 |
| d2 + q | `passedPawnPush` 24 + `mobility` 10                    | +296 |
| d3     | `offeredMaterial` −20 + `mobility` 5                   | +267 |
| d3 + q | `centralization` 8 + `space` 6 + `passedPawnPush` 24   |  top |

Safety plus activity below quiescence; activity plus an endgame feature with it. Two features
that measure the same thing repeat each other: `centralization` + `space` at d2 (+140) is below
`centralization` alone (+170), and `hanging` + `offeredMaterial` at d3 gains nothing over
`offeredMaterial` + `mobility`.

### 6. Some features only work as partners

`huddle` is +160 alone at d1 but lifts `offeredMaterial` or `hanging` by ~+100 — a king-side
cluster is safety the capture count can't see. `earlyQueen` (+111 alone at d1) and
`passedPawnPush` (+94 alone at d3 + q) each cover a phase their partner ignores. Judge a feature
by its best pair, not only by its solo number.

### 7. Search with no evaluation plays blind

Bare `material` is last in every d3 + q field, by 300–600. The Raven's roster rank comes from
out-searching weaker bots; against opponents on the same search, evaluation decides.

## Singles by search

Best known weight, Δ over bare `material` in its run.

| feature            | d1         | d2         | d3         | d3 + q     |
| ------------------ | ---------- | ---------- | ---------- | ---------- |
| `offeredMaterial`  | −40 → +327 | −20 → +312 | −20 → +200 | −10 → +251 |
| `hanging`          | −50 → +314 | −50 → +242 | −50 → +162 | −50 → +162 |
| `mobility`         | 10 → −167  | 10 → +203  | 5 → +157   | 10 → +532  |
| `centralization`   | 5 → −12    | 8 → +170   | 8 → +173   | 4 → +452   |
| `space`            | —          | 6 → +143   | —          | 3 → +415   |
| `swarm`            | —          | 40 → +109  | —          | 20 → +209  |
| `kingDanger`       | —          | −20 → +108 | —          | −20 → +138 |
| `pushDepth`        | —          | 10 → +80   | —          | 10 → +128  |
| `passedPawnPush`   | —          | —          | —          | 24 → +94   |
| `castled`          | —          | 40 → +74   | —          | 20 → +86   |
| `huddle`           | 40 → +160  | 20 → +15   | —          | —          |
| `earlyQueen`       | −80 → +111 | —          | —          | —          |
| `centerControl`    | 15 → +30   | 30 → +95   | —          | —          |
| `development`      | 10 → +61   | 20 → +83   | —          | —          |
| `kingActivity`     | 20 → +67   | —          | —          | —          |
| `givesCheck`       | —          | 20 → +73   | —          | —          |
| `opponentMobility` | —          | −8 → +26   | −10 → +39  | —          |

A dash is untested on this pass, not zero.

## The roster against its alternatives

Each animal in a field with its alternatives, best first. Every alternative below uses a
combination no other animal has.

| animal   | search | now                                                    | best alternative                           | margin |
| -------- | ------ | ------------------------------------------------------ | ------------------------------------------ | -----: |
| Spider   | d1     | `mobility` 10                                          | `mobility` 10 + `offeredMaterial` −40      |   +432 |
| Fox      | d2     | `offeredMaterial` −30                                  | `offeredMaterial` −20 + `swarm` 40         |   +122 |
| Eagle    | d2     | `centerControl` 30                                     | `centerControl` 15 + `offeredMaterial` −20 |   +193 |
| Hedgehog | d2     | `hanging` −100                                         | `hanging` −50 + `huddle` 20                |    +26 |
| Hippo    | d2     | `centralization` 20                                    | `centralization` 8 + `development` 20      |    +19 |
| Camel    | d2 + q | `passedPawnPush` 12 + `kingActivity` 20                | `passedPawnPush` 24 + `mobility` 10        |   +188 |
| Snake    | d3     | `opponentMobility` −10                                 | `opponentMobility` −8 + `hanging` −50      |    +84 |
| Bear     | d3     | `centralization` 8 + `space` 6 + `castled` 40          | drop `space`                               |    +79 |
| Hare     | d3     | `offeredMaterial` −20 + `hanging` −100                 | —                                          |      — |
| Tiger    | d3 + q | `swarm` 40 + `mobility` 10 + `earlyQueen` −40          | `centralization` 8 + `space` 6             |  ~+120 |
| Lion     | d3 + q | `kingDanger` −40 + `development` 20 + `earlyQueen` −80 | — (all variants ±140)                      |      — |

- **Each alternative reads as behaviour, not a handicap.** The Fox stalks the king but leaves
  nothing loose. The Hedgehog curls up (`huddle`) instead of only guarding. The Hippo develops
  behind its centre, which is what the Hippopotamus defence does. The Snake constricts without
  leaving a piece behind. The Spider spins its reach only over safe squares.
- **Hedgehog, Hippo and Bear gain little.** Swap them for their idea, not for Elo.
- **The Hare is already its own best version.** At d3, `hanging` −100 beats −50 by 61, and
  `offeredMaterial` + `mobility` beats it only inside the noise.
- **The Camel has no middlegame.** Both its features switch on only as material comes off, and
  `kingActivity` adds nothing once `mobility` covers the middlegame (−25, noise).
- **Obsession animals stay as they are.** The Wolf (`swarm` 600) and the Sloth (`huddle` 550) are
  meant to lose material to their idea. A safety partner lifts either by ~+100–150 without
  changing its tier.

## Open leads

- **A d3 + q board-control animal.** `centralization` 8 + `space` 6 + `passedPawnPush` 24 topped
  its field, and no animal on quiescence reads `centralization` or `space`. It is the Bear's idea
  one search up.
- **`kingActivity`** helps nothing it has been paired with. If the Camel drops it, no animal reads
  it, and it is the next feature to cut.
- **The Lion's field is flat.** Every king-safety variant at d3 + q sat inside ±140. Settling it
  needs a narrower field (three or four players).

## Cut on earlier evidence

- **`reverseStarting`** cleared the noise floor but never earned an animal, and it cost more per
  node than any other feature.
- **`kingPawnDistance`** sat inside the noise, unweighted.
