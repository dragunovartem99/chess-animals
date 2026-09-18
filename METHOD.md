# METHOD.md

What this project measures and why the numbers mean anything. How the app is built lives in
[ARCHITECTURE.md](./ARCHITECTURE.md), the code conventions in [CLAUDE.md](./CLAUDE.md), and the
order the work lands in [PLAN.md](./PLAN.md).

## The problem

Chess ratings are calibrated for players who are trying. Below a certain point the scale stops
describing anything: a bot that moves at random and a bot that runs its king up the board are
both "very bad", and no rating list says which is worse.

Tom 7's [_Elo World_](paper.pdf) (SIGBOVIK 2019) attacks that by playing dozens of deliberately
weak or quirky players against each other — `swarm`, `huddle`, `pacifist`, `cccp`,
`min_oppt_moves`, `same_color`, `suicide_king` — plus diluted Stockfish, and rating the whole
crowd together. This project rebuilds that idea as something interactive, and takes the paper's
own stated weaknesses as its design constraints:

| The paper                                                                   | Here                                                                                               |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Elo is order-, k- and imbalance-sensitive; 19 runs × 20 passes to stabilise | Bradley-Terry maximum likelihood — order-free, converges in milliseconds                           |
| Tens of thousands of CPU hours                                              | Variance reduction bought instead of games: paired openings, common random numbers, a result cache |
| Not robust against adding a player                                          | The cache is content-addressed, so a new bot replays only its own games                            |

## One mechanism for every bot

The central design choice: **every bot, serious or silly, is the same code path.** A move's score
is a dot product.

```ts
score = dot(features(position, move), weights);
```

A personality is nothing but a weight vector. `swarm` is not a special case in the engine — it is
a positive weight on a feature that measures distance to the enemy king, with everything else at
zero. The random bot is every weight at zero, where the argmax tie-break picks uniformly. That is
what makes the roster extensible: **adding a heuristic is one registry entry and one C
function**, and adding an animal is a data file.

27 features in six families, declared once in `shared/eval/features.ts`. That single registry
drives the engine's feature ids, the weight-editor sliders, the SPSA parameter space, the JSON schema for
bot configs, and the locale files.

A family says **what a feature measures**, not where the idea came from. That matters because the
weight editor takes each family's slider band from it, so filing two unlike quantities together
gives them the wrong scale — and because the pairs animals are built from should sit side by
side: `mobility` with `opponentMobility` (the Spider and the Snake), `hanging` with `offeredMaterial` (the Hare,
and the lab's two strongest features).

| Family     | Count | Features, with the registry's default weight in centipawns                                                                                                                                                                   |
| ---------- | ----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `material` |     5 | one **tunable** weight per piece — `materialPawn` 100, `materialKnight` 320, `materialBishop` 330, `materialRook` 500, `materialQueen` 900                                                                                   |
| `activity` |    11 | reach, ground and good squares — `mobility` 4, `opponentMobility` 0, `centralization` 0, `space` 2, `centerControl` 8, `pushDepth` 0, `development` 15, `earlyQueen` −10, `castled` 40, `kingActivity` 0, `passedPawnPush` 0 |
| `safety`   |     3 | what is about to be lost, ours minus theirs — `hanging` −15, `offeredMaterial` 0, `kingDanger` −12                                                                                                                           |
| `distance` |     3 | where the army stands relative to a king, negated so more is nearer — `swarm` 0, `huddle` 0, `kingProximity` 0                                                                                                               |
| `shape`    |     2 | whole-board properties, which read the same from either seat — `sameColorSquares` 0, `mirrorRanks` 0                                                                                                                         |
| `move`     |     3 | properties of the move played — `givesMate` 1, `givesCheck` 0, `captureValue` 0; `givesMate` is a preference in [−1, 1], not centipawns                                                                                      |

`centralization` is a stand-in for a piece-square table: one number — how far the pieces stand
from the rim — instead of sixty-four per role. The lab rated per-role sliders as noise and every
middlegame pawn-structure weight at or below bare material, so neither is in the registry;
`passedPawnPush` is the one piece of pawn structure kept, and only in the endgame. What each
candidate measured is in [LAB.md](./LAB.md).

The `move` family is why `cccp` and `pacifist` need no special casing — "prefer checks", "never
capture" are weights like any other.

## A bot says only what it is

A definition is a **base** and the animal's own idea over the top of it. `zero` is nothing,
`mate` sees a checkmate and takes it, `material` adds the classical piece values — so the Sloth
is `base: "material"` and `{ huddle: 550 }`, and the one line that is the animal is the only
line in the file. Naming a feature the base sets replaces it, so disagreeing costs one line too.

A base is frozen literal numbers, never derived from the registry's suggested defaults: those are
free to be retuned, and a base that tracked them would silently rewrite every bot ever written on
it. Changing a base means changing every bot that names it; the safe move is to add another.

## Everything in centipawns

A weight is centipawns per unit of its feature, and a pawn is 100 — the currency a chess player
already thinks in. `mobility: 4` is four hundredths of a pawn per square of activity;
`swarm: 900` is a queen per king-move the army closes. A bot that wants one idea to dominate
says so with a big number on that idea, never by shrinking everything else — shrinking a pawn
makes a bot's numbers comparable to nothing a player knows.

`givesMate` is the only exception, and is a preference in [-1, 1]: what it prices is not worth a
number of pawns.

## One vector, not three

A bot is a single weight vector — no opening, middlegame and endgame sets interpolated along a
phase axis. That was tried; no animal used it, and it tripled the configuration surface.

Per-feature phase shaping inside an extractor is fine; what is ruled out is phase-paired weight
vectors. The eval context carries one `phase` scalar, and an endgame feature (`kingActivity`,
`passedPawnPush`) scales its own _value_ by it — the same kind of shaping as `swarm` being negated
on the way out — so it is still one weight per feature, one vector, one dot product.

## Why there is no sampling

A bot always plays its argmax. Ties between equal moves are broken by a seeded shuffle of the root,
and every pairing is played over the opening set, so two deterministic bots do not replay one game
— that is where a result's variety comes from.

There is no softmax `temperature`: the one animal that used it did so only to weaken itself,
which a weight says just as well without throwing evaluation away at random.

Everything random comes from one seeded xorshift128, per game. A tournament replays exactly.

## Rating

Pure functions over a win/loss/draw matrix, unit-tested against synthetic data with known ground
truth.

**Bradley-Terry MLE** — MM iterations to maximum likelihood, with a white-advantage term, a draw
parameter (Rao–Kupper), and a weak prior anchoring the mean so an undefeated bot doesn't diverge
to infinity. Order-independent and imbalance-robust, which is precisely what the paper struggled
with. Standard errors from the inverse Hessian diagonal give the confidence intervals the
scheduler needs.

**Markov champion** — the paper's trophy transition matrix, power-iterated to its stationary
distribution. Implemented and tested as a second opinion, because the paper shows the two
disagree in interesting places (`same_color`); the arena does not print it yet.

## Buying speed instead of games

The roster is 24 bots, rated together on every run. Four choices keep that cheap:

1. **Whole games run inside a worker.** The runner is a dev CLI: a Node `worker_threads` worker
   takes `{ white, black, openingFen, seed, plyLimit }` and returns a result — no per-move round
   trip. Pool size is `availableParallelism() − 1`.
2. **Paired openings.** Every opening is played twice with colours swapped, from ~50 curated
   balanced positions. A bot that only wins as White scores what it deserves.
3. **Common random numbers.** Two candidates are compared over the same openings with the same
   seeds, so the paired difference has a fraction of the variance of two independent
   measurements.
4. **A content-addressed cache** on the filesystem, keyed by `hash(white, black, openingId, seed)`.
   Adding a bot replays only that bot's games; editing one weight invalidates only that bot's
   rows.

On top of that, **adaptive pairing** rather than a full round robin: play the pair whose game
most reduces rating uncertainty — close ratings, wide intervals — and stop when every interval is
under threshold or the ordering has been stable for _k_ games.

## Tuning

SPSA over the weights the bot names: draw a Rademacher perturbation δ, play `w+cδ`
and `w−cδ` over the same gauntlet with the same seeds, then step
`w ← w + a·(score₊ − score₋)/(2c)·δ` with `a` and `c` decaying. The paired gauntlet is what makes
a noisy signal usable. Target: a useful run in 1–2 minutes.

## How we know it works

- **Unit** — every feature against hand-checked FENs, and bit for bit against a frozen corpus; the UCI codec's
  round-trips; `fitBradleyTerry` recovering known ratings from a synthetic matrix and staying
  stable under deliberately imbalanced pair counts; `markovChampion` on a matrix with a known
  stationary distribution.
- **Determinism** — the same tournament seed twice gives an identical rating table.
- **Behavioural sanity** — every animal with a positional idea outscores the Donkey; the Dove,
  the Lemming (the paper's `pacifist` and `generous`) and the Mouse are the ones the Donkey
  beats, and the Dodo edges it. **Matching the paper's ordering is the strongest signal the
  features are right**, and it is the check that would actually catch a wrong sign.
- **Performance** — `npm run engine:bench` reports the cost of each feature and a search
  signature, `npm run bench` the search through wasm; the suite holds a depth-3 pass under 20 ms.

## Designed for, not built

- **Golden games** — fixed pair + fixed seed + fixed opening → a committed PGN fixture. Any eval
  change that shifts a game shows up as a diff, the cheapest regression net for a heuristic
  engine.
- **Opening book** — the curated JSON set sits behind a `probe(fen)` interface a Polyglot `.bin`
  reader can implement later. `probe(fen)` is in place; the `bot.useBook` flag is not wired yet.
- **Endgame tablebase** — `probe(fen) → { wdl, dtz, moves }`, simplest backing being lichess's
  free 7-man HTTP API with an IndexedDB cache.
- **Real Stockfish** — a second implementation of `UciEngine`, which unlocks the paper's
  **dilution ladder**: Stockfish playing a random move 1-in-N of the time gives calibrated
  reference points at every rating level. That is how the scale gets absolute meaning instead of
  being self-referential.

## Credit

[_Elo World, a framework for benchmarking weak chess engines_](paper.pdf), Dr. Tom Murphy VII
Ph.D., SIGBOVIK 2019.
