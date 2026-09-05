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
what makes the roster extensible: **adding a heuristic is one registry entry and one extractor
line**, and adding an animal is a data file.

25 features in five families, declared once in `shared/eval/features.ts`. That single registry
drives the extractor, the weight-editor sliders, the SPSA parameter space, the JSON schema for
bot configs, and the locale files.

| Family        | Count | Features, with the registry's default weight in centipawns                                                                                                                   |
| ------------- | ----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `material`    |     5 | one **tunable** weight per piece — `materialPawn` 100, `materialKnight` 320, `materialBishop` 330, `materialRook` 500, `materialQueen` 900                                   |
| `positional`  |     5 | `centerControl` 8, `space` 2, `hanging` −15, `mobility` 4, `centralization` 0                                                                                                |
| `king`        |     2 | `kingAttackers` −12, `kingPawnDistance` −4                                                                                                                                   |
| `behavioural` |     9 | the animals, all default 0: `swarm`, `huddle`, `kingProximity`, `reverseStarting`, `sameColorSquares`, `symmetryMirrorY`, `opponentMobility`, `pushDepth`, `offeredMaterial` |
| `move`        |     4 | properties of the move played — `givesMate` 1, `givesCheck` 0, `givesStalemate` 0, `captureValue` 0; the two `gives*` enders are preferences in [−1, 1], not centipawns      |

`centralization` is a parametrised stand-in for a piece-square table: one number — how far the
pieces stand from the rim — instead of sixty-four per role. The registry once carried a
centralization _and_ an advancement weight _per role_, then two role-agnostic ones; the lab rated
the per-role sliders as noise and, on a second pass, rated every pawn-structure weight the
registry had (passed pawns, a lumped weakness, pawn advancement) at or below bare material — so
the whole `pawns` family is gone rather than kept as dead sliders. A knight wanting the centre and
a rook wanting the seventh come out of the one `centralization` number.

The `move` family is why `cccp` and `pacifist` need no special casing — "prefer checks", "never
capture" are weights like any other.

## A bot says only what it is

A definition is a **base** and the animal's own idea over the top of it. `zero` is nothing,
`mate` sees a checkmate and takes it, `material` adds the classical piece values — so the Turtle
is `base: "material"` and `{ huddle: -750 }`, and the one line that is the animal is the only
line in the file. Naming a feature the base sets replaces it, so disagreeing costs one line too.

A base is frozen literal numbers, never derived from the registry's suggested defaults: those are
free to be retuned, and a base that tracked them would silently rewrite every bot ever written on
it. Changing a base means changing every bot that names it; the safe move is to add another.

## Everything in centipawns

A weight is centipawns per unit of its feature, and a pawn is 100 — the currency a chess player
already thinks in. `mobility: 4` is four hundredths of a pawn per square of activity;
`swarm: -900` is a queen per king-move the army closes. A bot that wants one idea to dominate
says so with a big number on that idea, never by shrinking everything else: the roster used to
price a pawn at 20 so `huddle` could outweigh it, and the result was five animals whose numbers
could not be compared with each other or with anything a player knows. Multiplying a whole vector
by a constant changes no move an argmax bot plays, so this cost nothing to fix.

The two game-enders are the only exception, and are preferences in [-1, 1]: what they price is
not worth a number of pawns.

## One vector, not three

A bot is a single weight vector. It used to carry three — opening, middlegame and endgame,
interpolated along a phase axis — so that it could value a rook differently late than early. No
animal ever used it: every definition wrote only the middlegame set and inherited the other two,
and the sandbox applied one vector to all three. It was three times the configuration surface, a
blend cache in the evaluator and a phase axis in the tuner, all to express something nothing
expressed. It is gone. A bot is what its file says, once.

## Why sampling matters

`temperature: 0` is a strict argmax. Above zero, the move is a softmax sample over the scores.

This is not only for reproducing the paper's weighted-sampling players. A fully deterministic bot
plays the same game against itself every time and draws by repetition — the paper hit exactly
this with `first_move` and `reverse_starting`. Temperature is what makes a self-play result
informative.

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
distribution. Shipped alongside the MLE as a second opinion, because the paper shows the two
disagree in interesting places (`same_color`).

## Buying speed instead of games

The target is a 12-bot pool ranked to ±40 Elo in **under 30 seconds** on 8 cores. Four choices
get there:

1. **Whole games run inside a worker.** The runner is a dev CLI: a Node `worker_threads` worker
   takes `{ white, black, openingFen, seed, plyLimit }` and returns a result — no per-move round
   trip. Pool size is `availableParallelism()`.
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

- **Unit** — the extractor against hand-checked FENs; the UCI codec's
  round-trips; `fitBradleyTerry` recovering known ratings from a synthetic matrix and staying
  stable under deliberately imbalanced pair counts; `markovChampion` on a matrix with a known
  stationary distribution.
- **Golden games** — fixed pair + fixed seed + fixed opening → a committed PGN fixture. Any eval
  change that shifts a game shows up as a diff, which is the cheapest possible regression net for
  a heuristic engine.
- **Determinism** — the same tournament seed twice gives an identical rating table.
- **Behavioural sanity** — the Wolf beats the Donkey well over 90% of paired games; the pacifist
  draws far more than it wins. **Matching the paper's ordering is the strongest signal the
  features are right**, and it is the check that would actually catch a wrong sign.
- **Performance** — `npm run bench` reports extraction cost; the suite asserts it under the 60 µs
  guard, and a full 12-bot ranking under the 30 s budget.

## Designed for, not built

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
