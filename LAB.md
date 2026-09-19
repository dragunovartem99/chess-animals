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

## The roster

Every idea animal leads with a feature no other animal reads. Partners may repeat, but no two
animals share a full weight set. Three overlaps are deliberate: the Goat and the Dove are the same
weights with opposite signs; the Fox and the Lemming read `offeredMaterial` with opposite signs;
and the Monkey, Owl and Raven are bare material at three searches, as the calibration line.

| animal   | search | lead (its own)         | partners                            |
| -------- | ------ | ---------------------- | ----------------------------------- |
| Spider   | d1     | `mobility` 10          | —                                   |
| Parrot   | d2     | `mirrorRanks` 150      | —                                   |
| Elephant | d2     | `sameColorSquares` 600 | —                                   |
| Sloth    | d2     | `huddle` 550           | —                                   |
| Wolf     | d2     | `swarm` 600            | —                                   |
| Hedgehog | d2     | `hanging` −50          | —                                   |
| Fox      | d2     | `offeredMaterial` −20  | `centerControl` 15                  |
| Bear     | d3     | `centralization` 8     | `castled` 20                        |
| Hare     | d3     | `opponentMobility` −8  | `hanging` −100                      |
| Camel    | d2 + q | `passedPawnPush` 24    | `kingActivity` 20, `development` 20 |
| Lion     | d3 + q | `kingDanger` −40       | `development` 20, `earlyQueen` −80  |
| Tiger    | d3 + q | `space` 6              | `swarm` 20, `mobility` 10           |

What the lab said for each change, against the old weights in the same field:

- **Bear, +77.** `centralization` and `space` measure nearly the same thing; dropping `space`
  and halving `castled` beat the triple.
- **Camel, +75.** Both endgame features are silent in the opening, so it played that phase as
  bare material. `development` beat `castled`, `pushDepth` and `centerControl` as the fix.
- **Fox, +15 to +37.** `centerControl` 15 or 30 over `offeredMaterial` −20, the partner the cut
  Eagle left free.
- **Hedgehog, +22.** `hanging` −50 over −100: observation 4.
- **Hare, −37.** `opponentMobility` + `hanging` sits inside the noise of the old
  `offeredMaterial` + `hanging`, and gives it a lead of its own instead of the Fox's.
- **Tiger, +52 (±110).** The `space`-led stack ties the old `swarm` + `mobility` + `earlyQueen`
  and leaves `earlyQueen` to the Lion.
- **Spider, unchanged.** Every `mobility` stack at d1 still loses to bare material; the best
  (`mobility` 5 + `earlyQueen` −80) gained +93, not enough to move it off its slot.

## Gaps

The full roster runs in seconds off the cache, but its CIs are ±70–190, so a gap under ~100 is
not a measurement: the Sloth–Elephant gap read 27 in one run and 104 in the next. The wide gaps
that stay are structural. At the bottom the Goat, Dodo, Donkey, Lemming and Dove are the paper's
fixed strategies. At the top the Tiger wins nearly every game, so its rating floats — on depth 4
with quiescence it was ~+300 stronger head to head, yet rated the same on the roster.

## Open leads

- **`kingActivity`** helps nothing it has been paired with (−25 beside `mobility` on the Camel).
  The Camel is the only animal that reads it, and it is the next feature to cut.
- **The Lion's field is flat.** Every king-safety variant at d3 + q sat inside ±140. Settling it
  needs a narrower field (three or four players).

## Cut on earlier evidence

- **`reverseStarting`** cleared the noise floor but never earned an animal, and it cost more per
  node than any other feature.
- **`kingPawnDistance`** sat inside the noise, unweighted.
