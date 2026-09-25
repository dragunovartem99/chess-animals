# LAB.md

What the bench in [`cli/lab.ts`](./cli/lab.ts) says about weights today. This file is the current
state, not a log: when a re-run changes a number, overwrite it.

It covers the land animals only. The underwater animals and the monsters carry no weights — a
Maia rating, a Stockfish temperature — and the arena places them directly; see their comments in
`src/modules/bots/roster/`.

## How to run it

Stage candidates in `cli/lab.ts` and run `npm run arena -- --lab-only` (or `--lab` to add the
full roster). Size the field by cost:

| search | field | wall time |  95% CI |
| ------ | ----: | --------: | ------: |
| d1, d2 |  ≤ 18 |      ~5 s |     ±45 |
| d3     |  ≤ 12 |      ~7 s |     ±55 |
| d3 + q |   6–7 |      ~4 s | ±60–140 |

The arena stops once the order is safe, so a bigger field gets fewer games per pair, not sharper
ratings. A d3 + q table orders its players; trust its gaps only when they exceed ~150.

A rating means something only inside its own run. Compare within one table, never across tables,
never against the roster's points. The same candidate moves ±50 between runs just from who else
is in the field.

## Method

Every candidate is `base: "material"` plus the weights under test, rated against bare `material`
at the **same search**. Change one thing at a time:

1. **Singles** — one feature at its known-best weight, per search.
2. **Pairs** drawn from the top singles of one search.
3. **The roster against its alternatives**, one animal at a time, with the current one in the
   field.

## Findings

1. **A feature helps only if it tells the search something it can't see.** Material plus search
   covers what the search reaches; a weight pays off when it brings knowledge from past the
   horizon, and costs Elo when it repeats what the search already knows. Bare `material` is last
   in every d3 + q field, by 300–600: on the same search, evaluation decides.
2. **Below quiescence, safety wins; with it, board control wins.** `offeredMaterial` and `hanging`
   stand in for the capture search a plain search lacks. Once quiescence resolves the captures,
   `mobility`, `centralization` and `space` take over (see the singles).
3. **At depth 1, reaching further is a liability.** Every attack-map feature loses at d1: a piece
   that reaches further also stands further out, and one ply can't see the recapture. Activity at
   d1 works only behind a safety feature — `mobility` 10 + `offeredMaterial` −40 is +265. The
   Spider is `mobility` alone at d1, and so the weakest material animal.
4. **The deeper the search, the lighter the best weight.** `offeredMaterial` −40 at d1, −20 at
   d2–d3, −10 with quiescence. Obsession weights (`swarm` 600, `huddle` 550) sit 240–290 below
   bare material at d2 — which is exactly what the Wolf and the Sloth are for.
5. **Pairs work when the two features know different things.** Safety plus activity below
   quiescence; activity plus an endgame feature with it. Two features that measure the same thing
   repeat each other: `centralization` + `space` at d2 (+140) is below `centralization` alone
   (+170).
6. **Some features only work as partners.** `huddle` is +160 alone at d1 but lifts
   `offeredMaterial` or `hanging` by ~100 — a king-side cluster is safety the capture count can't
   see. `earlyQueen` and `passedPawnPush` each cover a phase their partner ignores. Judge a
   feature by its best pair, not only by its solo number.

## Singles by search

One weight per feature per search — the best of the last sweep — and its Δ over bare `material`
in its own run. Sorted by d3 + q. d1–d3 runs carry ±35–70; d3 + q runs ±90–130.

| feature            | d1         | d2         | d3         | d3 + q     |
| ------------------ | ---------- | ---------- | ---------- | ---------- |
| `offeredMaterial`  | −40 → +327 | −20 → +312 | −20 → +200 | −10 → +251 |
| `hanging`          | −50 → +314 | −50 → +242 | −50 → +162 | −50 → +162 |
| `mobility`         | 10 → −167  | 10 → +203  | 5 → +157   | 10 → +532  |
| `centralization`   | 5 → −12    | 8 → +170   | 8 → +173   | 4 → +452   |
| `space`            | 12 → −278  | 6 → +143   | 12 → +28   | 3 → +415   |
| `huddle`           | 40 → +160  | 20 → +15   | 40 → +102  | 20 → +331  |
| `swarm`            | 40 → −294  | 40 → +109  | 20 → −29   | 20 → +209  |
| `centerControl`    | 15 → +30   | 30 → +95   | 30 → +83   | 15 → +164  |
| `development`      | 10 → +61   | 20 → +83   | 40 → +23   | 10 → +158  |
| `kingDanger`       | −20 → −248 | −20 → +108 | −20 → −6   | −20 → +138 |
| `pushDepth`        | 20 → −252  | 10 → +80   | 10 → +22   | 10 → +128  |
| `passedPawnPush`   | 24 → +44   | 24 → −18   | 24 → +5    | 24 → +94   |
| `givesCheck`       | 80 → −132  | 20 → +73   | 40 → +40   | 20 → +54   |
| `opponentMobility` | −4 → −167  | −8 → +26   | −10 → +39  | −4 → +47   |
| `earlyQueen`       | −80 → +111 | −20 → −35  | −20 → +6   | −20 → +27  |
| `captureValue`     | 50 → −38   | 25 → −39   | 10 → −54   | 10 → +22   |
| `kingActivity`     | 20 → +67   | 10 → −198  | 10 → −23   | 20 → −143  |

## Best pairs

| search | best pair / triple                                     |    Δ |
| ------ | ------------------------------------------------------ | ---: |
| d1     | `offeredMaterial` −40 + `earlyQueen` −80 + `huddle` 40 | +459 |
| d1     | `hanging` −50 + `huddle` 40                            | +414 |
| d2     | `offeredMaterial` −20 + `swarm` 40                     | +364 |
| d2     | `offeredMaterial` −20 + `mobility` 10                  | +358 |
| d2 + q | `passedPawnPush` 24 + `mobility` 10                    | +296 |
| d3     | `offeredMaterial` −20 + `mobility` 5                   | +267 |
| d3 + q | `centralization` 8 + `space` 6 + `passedPawnPush` 24   |  top |

## The land roster

Every idea animal leads with a feature no other animal reads, chosen to fit how it plays.
Partners may repeat, but no two animals share a full weight set. Three overlaps are deliberate:
the Dove is the Goat's checks and captures with opposite signs, and the Hare and the Lemming read
`offeredMaterial` with opposite signs. Bare material — once the Monkey, Owl and Raven — left the
roster for want of an idea; `lab()` is the same baseline. The paper's fixed strategies (Dove,
Lemming, Donkey, Dodo, Goat) sit below the table.

| animal   | search | lead (its own)         | partners                                                            |
| -------- | ------ | ---------------------- | ------------------------------------------------------------------- |
| Spider   | d1     | `mobility` 10          | —                                                                   |
| Parrot   | d2     | `mirrorRanks` 150      | —                                                                   |
| Elephant | d2     | `sameColorSquares` 600 | —                                                                   |
| Sloth    | d2     | `huddle` 550           | —                                                                   |
| Wolf     | d2     | `swarm` 600            | —                                                                   |
| Fox      | d2     | `opponentMobility` −8  | `hanging` −50                                                       |
| Bear     | d3     | `huddle` 40            | —                                                                   |
| Hare     | d3     | `offeredMaterial` −20  | `mobility` 5                                                        |
| Camel    | d2 + q | `passedPawnPush` 24    | `kingActivity` 20, `development` 20                                 |
| Lion     | d3 + q | `kingDanger` −40       | `development` 20, `earlyQueen` −80, `huddle` 20, `centerControl` 30 |
| Tiger    | d3 + q | `swarm` 20             | `mobility` 10                                                       |

Why each weight set is what it is lives in the animal's own file. What the lab ruled out, so it
isn't tried again:

- **Fox** with `centerControl` in place of `hanging`: ~−150.
- **Camel** as a pawn caravan (`passedPawnPush` + `pushDepth`): ~−140. Without `development` it
  played the opening as bare material, −75.
- **Tiger** with `space`: it repeats `swarm` and `mobility` (finding 5); pulling it rated the
  Tiger higher in three separate runs.
- **Lion** with `mobility` 10: closed most of the gap to the Tiger, but board activity is the
  Tiger's idea, not the Lion's. `development` 40 in place of `centerControl` 30 measured worse.
- **Spider** on any `mobility` stack at d1: still loses to bare material.

## Noise and gaps

The full arena runs in seconds off the cache, but its CIs are ±70–190, so a gap under ~100 is not
a measurement: the Sloth–Elephant gap read 27 in one run and 104 in the next. Every king-safety
variant of the Lion at d3 + q sat inside ±140 of the others — its field is flat, and a change
there is kept only if it never loses across runs. The wide gaps that stay are structural: the
fixed strategies at the bottom, and at the top the Tiger, which now overlaps the weakest monsters
rather than floating alone.

## Open leads

- **`kingActivity` is flavour, not strength.** Alone it loses at d2, d3 and d3 + q. With its taper
  squared, 0, 20, 40 and 60 on the Camel all rate within noise. It stays for the Camel's king
  walk.

## Cut on earlier evidence

- **`reverseStarting`** cleared the noise floor but never earned an animal, and it cost more per
  node than any other feature.
- **`kingPawnDistance`** sat inside the noise, unweighted.
- **`castled`** rated level as the Bear's partner, and went with the feature.
