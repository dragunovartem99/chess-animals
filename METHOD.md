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
score = dot(features(position, move), lerp3(weights, phase));
```

A personality is nothing but a weight vector. `swarm` is not a special case in the engine — it is
a positive weight on a feature that measures distance to the enemy king, with everything else at
zero. The random bot is every weight at zero, where the argmax tie-break picks uniformly. That is
what makes the roster extensible: **adding a heuristic is one registry entry and one extractor
line**, and adding an animal is a data file.

62 features in six families, declared once in `shared/eval/features.ts`. That single registry
drives the extractor, the weight-editor sliders, the SPSA parameter space, the JSON schema for
bot configs, and the locale files.

| Family        | Count | What it covers                                                                                                                   |
| ------------- | ----: | -------------------------------------------------------------------------------------------------------------------------------- |
| `material`    |     5 | one weight per piece — piece values are **tunable per phase**, not constants                                                     |
| `positional`  |    22 | centralization and advancement per role, rook on open file and seventh, bishop pair, outpost, space, centre control, hanging     |
| `pawns`       |     8 | doubled, isolated, backward, connected, passed and its advancement, shield, islands                                              |
| `king`        |     4 | king-zone attackers, ring defenders, open file, king–pawn distance, and the endgame centralization term                          |
| `behavioural` |    11 | the animals: swarm, huddle, king proximity, same-colour squares, the symmetries, opponent mobility, push depth, offered material |
| `move`        |    12 | properties of the move that produced the position — gives mate, gives check, capture value, promotion, castle, moved role        |

Centralization and advancement are a parametrised stand-in for piece-square tables: two numbers
per role instead of sixty-four, which is what keeps the tuner's search space small enough to move
in seconds.

The `move` family is why `cccp` and `pacifist` need no special casing — "prefer checks", "never
capture" are weights like any other.

## Three phases, blended

A bot carries three weight sets, so it can value a rook differently in the opening than in the
endgame. They are **interpolated** along the phase axis rather than switched between: a hard
switch puts a step in the evaluation, and bots shuffle back and forth across it. Phase is
non-pawn material, 0 at the full board and 1 at bare kings — pawns are excluded because they
leave the board last and would keep every long game reading as a middlegame.

A definition may omit a phase, in which case it inherits from the middlegame. Most animals have
one idea and play it throughout, and writing that idea three times invites drift.

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

SPSA over one phase's weights or all three jointly: draw a Rademacher perturbation δ, play `w+cδ`
and `w−cδ` over the same gauntlet with the same seeds, then step
`w ← w + a·(score₊ − score₋)/(2c)·δ` with `a` and `c` decaying. The paired gauntlet is what makes
a noisy signal usable. Target: a useful run in 1–2 minutes.

## How we know it works

- **Unit** — the extractor against hand-checked FENs; phase interpolation; the UCI codec's
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
