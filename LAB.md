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
| `space`           | −278 | +143 |  +28 |   +415 |

`offeredMaterial` and `hanging` stand in for the capture search a plain search lacks. Once
quiescence resolves the captures, activity features take over and carry the strongest bots.

### 3. At depth 1, reaching further is a liability

Every attack-map feature loses at d1: `swarm` −294, `space` −278, `pushDepth` −252,
`kingDanger` −248, `mobility` −167. A piece that reaches further
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
| `castled`          | 80 → −59   | 40 → +74   | 40 → −13   | 20 → +86   |
| `givesCheck`       | 80 → −132  | 20 → +73   | 40 → +40   | 20 → +54   |
| `opponentMobility` | −4 → −167  | −8 → +26   | −10 → +39  | −4 → +47   |
| `earlyQueen`       | −80 → +111 | −20 → −35  | −20 → +6   | −20 → +27  |
| `captureValue`     | 50 → −38   | 25 → −39   | 10 → −54   | 10 → +22   |
| `kingActivity`     | 20 → +67   | 10 → −198  | 10 → −23   | 20 → −143  |

## The roster

Every idea animal leads with a feature no other animal reads, chosen to fit how the animal
plays. Partners may repeat, but no two animals share a full weight set. Three overlaps are
deliberate: the Goat and the Dove are the same weights with opposite signs; the Hare and the
Lemming read `offeredMaterial` with opposite signs; and the Monkey, Owl and Raven are bare
material at three searches, as the calibration line.

| animal   | search | lead (its own)         | partners                                                            |
| -------- | ------ | ---------------------- | ------------------------------------------------------------------- |
| Spider   | d1     | `mobility` 10          | —                                                                   |
| Parrot   | d2     | `mirrorRanks` 150      | —                                                                   |
| Elephant | d2     | `sameColorSquares` 600 | —                                                                   |
| Sloth    | d2     | `huddle` 550           | —                                                                   |
| Wolf     | d2     | `swarm` 600            | —                                                                   |
| Fox      | d2     | `opponentMobility` −8  | `hanging` −50                                                       |
| Hedgehog | d2     | `hanging` −50          | —                                                                   |
| Bear     | d3     | `castled` 40           | `huddle` 40                                                         |
| Hare     | d3     | `offeredMaterial` −20  | `mobility` 5                                                        |
| Camel    | d2 + q | `passedPawnPush` 24    | `kingActivity` 20, `development` 20                                 |
| Lion     | d3 + q | `kingDanger` −40       | `development` 20, `earlyQueen` −80, `huddle` 20, `centerControl` 30 |
| Tiger    | d3 + q | `swarm` 20             | `mobility` 10                                                       |

What the lab said for each, against the previous weights in the same field. Every change is
within noise or better; the point of most of them is fit, not Elo.

- **Fox, −43.** The trapper: `opponentMobility` takes your squares, `hanging` keeps the hunters
  safe. With `centerControl` in place of `hanging` it lost ~150.
- **Hare, +24.** Never in reach, always moving: `offeredMaterial` + `mobility` was the lab's best
  pair at d3.
- **Bear, +27.** A den: `castled` + `huddle`. `huddle` 40 is the best positional single at d3.
- **Camel, +75.** Both endgame features are silent in the opening, so it played that phase as
  bare material; `development` fixes it. A pawn-caravan Camel (`passedPawnPush` + `pushDepth`)
  lost ~140.
- **Hedgehog, +22.** `hanging` −50 over −100: observation 4.
- **Tiger, +52 (±110)** for the `space` + `swarm` + `mobility` stack over the old
  `swarm` + `mobility` + `earlyQueen`, which left `earlyQueen` to the Lion. Later dropped `space`
  again, this time for keeps: it repeats what `swarm` and `mobility` already read (observation 5)
  and pulling it rated the Tiger _higher_, not lower, in three separate runs — dead weight, not a
  brake.
- **Spider, unchanged.** Every `mobility` stack at d1 still loses to bare material.
- **Lion, +47 then +63.** `huddle` 20 closed part of the flat Raven-to-Tiger gap (see Open
  leads), ahead of the old weights twice running. A `mobility` 10 variant closed most of the rest
  in the full-roster arena but was ruled out to keep the Lion's identity to king safety and
  development, not board activity — that idea stays the Tiger's. `centerControl` 30 instead —
  unread by any other animal, and a hunt wanting the middle on the way in rather than raw
  activity — beat the `huddle`-only weights by ~60 in the same arena; `development` 40 in its
  place measured worse.

## Gaps

The full roster runs in seconds off the cache, but its CIs are ±70–190, so a gap under ~100 is
not a measurement: the Sloth–Elephant gap read 27 in one run and 104 in the next. The wide gaps
that stay are structural. At the bottom the Goat, Dodo, Donkey, Lemming and Dove are the paper's
fixed strategies. At the top the Tiger wins nearly every game, so its rating floats — on depth 4
with quiescence it was ~+300 stronger head to head, yet rated the same on the roster.

## Open leads

- **`kingActivity` is flavour, not strength.** Alone it loses at d2, d3 and d3 + q (−198, −23,
  −143; linear taper). Since its taper was squared — the Camel walked its king out after a queen
  trade — 0, 20, 40 and 60 on the Camel all rate within noise. It stays for the Camel's walk.
- **The Lion's field is flat.** Every king-safety variant at d3 + q sat inside ±140. A narrower
  three-player field (Lion, huddle variant, Tiger, Raven) still read inside noise, but `huddle`
  20 came out ahead of the old weights twice running, never behind — see the roster note below.

## Cut on earlier evidence

- **`reverseStarting`** cleared the noise floor but never earned an animal, and it cost more per
  node than any other feature.
- **`kingPawnDistance`** sat inside the noise, unweighted.
