# PLAN.md

The commit ladder — what has landed, what lands next, and what each step has to satisfy before it
counts. Why the project is shaped this way is in [METHOD.md](./METHOD.md), how it is built in
[ARCHITECTURE.md](./ARCHITECTURE.md), the conventions in [CLAUDE.md](./CLAUDE.md).

Work proceeds one commit at a time. **Every commit leaves the repo green** — format, types, lint,
tests, build — and does one thing, so each is reviewable on its own and revertable without
unpicking the next. Checked = landed on `main`.

## Phase A — foundations

| #   | Commit                                 | Contents                                                                                                 | Green when                                                     |
| --- | -------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1   | ✅ `chore: scaffold vite + vue 3 + ts` | Vite, TS config, oxlint/oxfmt, vitest, `.gitignore`                                                      | `npm run dev` serves a page; `npm test` passes with zero tests |
| 2   | ✅ `docs: add PLAN.md`                 | The design record                                                                                        | —                                                              |
| 3   | ✅ `chore: router + i18n shell`        | `vue-router` with `/:locale(ru\|en)`, `vue-i18n`, both locale folders, a switcher, placeholder routes    | Both locales render; an unknown locale redirects               |
| 4   | ✅ `shared/chess: position helpers`    | chessops wrappers — FEN, legal moves, game-over, repetition/50-move/insufficient material, tapered phase | Unit tests over hand-written FENs                              |
| 5   | ✅ `shared/engine: seeded rng`         | xorshift128, `nextInt`, `pick`, `softmaxSample`                                                          | Same seed → same sequence, asserted                            |

## Phase B — the eval

| #   | Commit                                     | Contents                                                                                                     | Green when                                              |
| --- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| 6   | ✅ `eval: feature registry + vector types` | The registry, `FeatureVector`/`WeightVector`, `dot`, phase interpolation                                     | Registry ids are unique and dense; interpolation tested |
| 7   | ✅ `eval: material and mobility features`  | The first extractor pass — 5 material features, mobility, safeMobility, tempo                                | Tested on FENs with known material and mobility         |
| 8   | ✅ `eval: positional features`             | Centralization/advancement, rook on open file and seventh, bishop pair, outpost, space, centre, hanging      | Per-feature tests                                       |
| 9   | ✅ `eval: pawn structure features`         | Doubled, isolated, backward, connected, passed, passedAdvancement, shield, islands                           | Per-feature tests                                       |
| 10  | ✅ `eval: king safety features`            | King-zone attackers, ring defenders, open file, king centralization, king–pawn distance                      | Per-feature tests                                       |
| 11  | ✅ `eval: behavioural features`            | swarm, huddle, kingProximity, sameColorSquares, the symmetries, opponentMobility, pushDepth, offeredMaterial | Each asserted where its sign is obvious                 |
| 12  | ✅ `eval: move-level features`             | givesMate, givesCheck, captureValue, isPromotion, isCastle, movedPieceType                                   | Tested through a move list                              |
| 13  | ✅ `perf: benchmark feature extraction`    | A bench script and an asserted budget                                                                        | Extraction under the 60 µs guard (~18 µs)               |

## Phase C — bots that play

| #   | Commit                             | Contents                                                                                  | Green when                                                    |
| --- | ---------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 14  | ✅ `engine: depth-1 greedy policy` | Score every legal move, argmax with a seeded tie-break; the temperature softmax path      | A bot plays a full legal game headlessly                      |
| 15  | ✅ `engine: negamax + alpha-beta`  | Configurable depth, move ordering, optional quiescence, node budget                       | Depth 2 beats depth 1 from the same weights over paired games |
| 16  | ✅ `bots: config type + roster`    | `BotDefinition`/`BotConfig`, the guard, `compileBot`, the first three animals as data     | The roster validates; each bot plays a legal game             |
| 17  | ✅ `engine: UCI codec`             | Parser and serializer for the subset, weights exposed as `setoption`                      | Round-trip tests on every message form                        |
| 18  | ✅ `engine: worker client`         | `uciEngine.worker.ts`, the transports, the `UciEngine` interface Stockfish will implement | A bot answers `go depth 2` from a worker                      |

## Phase D — playing it

| #   | Commit                             | Contents                                                        | Green when                                   |
| --- | ---------------------------------- | --------------------------------------------------------------- | -------------------------------------------- |
| 19  | ✅ `board: chessground wrapper`    | Board component, orientation, legal dests, the promotion picker | The board renders and accepts a human move   |
| 20  | ✅ `game: play view`               | `/play` — human vs bot, bot vs bot, move list                   | A game is playable end to end in the browser |
| 21  | ✅ `game: feature breakdown panel` | Per-feature contribution table for the current position         | The numbers sum to the reported eval         |

## Phase E — the arena (dev CLI)

The tournament runner is a **development tool, not a shipped feature**: it needs every core and
runs for tens of seconds, and the app has nothing to do with rating bots. It lives in `cli/`, run
under Node with `tsx`; there is no `/arena` route. The rating and scheduling math stays in
`shared/` as pure, unit-tested functions — the CLI is a thin shell over it.

| #   | Commit                                          | Contents                                                                                                        | Green when                                                                         |
| --- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 22  | ✅ `chore: drop the arena and tuner view stubs` | Delete `modules/arena` and `modules/tuner`, their routes, nav entries and locale keys                           | App builds; router and nav have no dead entries                                    |
| 23  | ✅ `openings: paired opening set`               | ~50 balanced FENs as JSON behind `probe(fen)`; colour-swapped pairing                                           | The set loads; pairing tested                                                      |
| 24  | ✅ `rating: bradley-terry MLE`                  | `shared/rating` — MM fit with white-advantage, draw parameter, prior anchor, CIs from the Hessian               | Recovers known ratings from a synthetic matrix; stable when pairs are imbalanced   |
| 25  | ✅ `rating: markov champion`                    | `shared/rating` — trophy transition matrix, power iteration                                                     | A known stationary distribution is recovered                                       |
| 26  | ✅ `scheduler: worker pool + game runner`       | `shared/scheduler` game runner + a Node `worker_threads` pool = `availableParallelism()`, ply cap, adjudication | 1000 games run across the pool and reproduce from seed                             |
| 27  | ✅ `scheduler: result cache`                    | Content-addressed cache on the filesystem, `hash(white, black, openingId, seed)`                                | Adding a bot replays only that bot's games                                         |
| 28  | ✅ `scheduler: adaptive pairing`                | Pick the pair that most reduces rating uncertainty; stop on a CI threshold or stable order                      | 12 bots to ±40 Elo in under 30 s                                                   |
| 29  | ✅ `cli: tournament runner`                     | `npm run arena` — drive the pool, print the cross-table + rating table with CIs, write results JSON             | The cross-table matches the rating order; a re-run from the same seed is identical |

## Phase F — tuning

The weight **sandbox** stays in the app — sliders, live eval and session-only edits are a good way
to explore a personality. There is no per-animal editor: one route, one weight vector, seedable
from any roster animal but not tied to its saved identity. The **tuner** is a dev CLI like the
arena: it burns cores for minutes and rewrites a bot's weights file.

| #   | Commit                                           | Contents                                                                                                                                                                          | Green when                                                  |
| --- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 30  | ✅ `frankenstein: live weight and depth sandbox` | `/frankenstein` — board, depth control, sliders by family (numeric input for out-of-band values), autoplay, seed from an animal or the registry defaults, live `FeatureBreakdown` | Sliders and depth change play immediately, no restart       |
| 31  | ✅ `tuner: SPSA core`                            | `shared/tuner` — Rademacher perturbation, paired gauntlet with common random numbers, decaying `a`/`c`                                                                            | Measurably improves a deliberately detuned bot              |
| 32  | ✅ `cli: tuner runner`                           | `npm run tune -- <botId>` — SPSA against a gauntlet, live score to stdout, write the weights JSON                                                                                 | A run completes in 1–2 minutes and lowers the gauntlet loss |

## Phase G — finishing

| #   | Commit                          | Contents                                                                        | Green when                                          |
| --- | ------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------- |
| 33  | ⬜ `bots: full animal roster`   | ~12 animals spanning the range, RU/EN names and descriptions                    | The ordering matches the paper's intuition          |
| 34  | ⬜ `test: golden games`         | Fixed pair + seed + opening → committed PGN fixtures                            | Any eval change surfaces as a diff                  |
| 35  | ⬜ `docs: about page`           | `/about` explaining the method and crediting the paper                          | Both locales complete                               |
| 36  | ⬜ `tablebase: probe interface` | `probe(fen) → { wdl, dtz, moves }` stub, `bot.useTablebase` honoured as a no-op | The interface compiles and is tested against a fake |

## Outside v1

- ⬜ Stockfish as a second `UciEngine` implementation — unlocks the dilution ladder
- ⬜ A Polyglot `.bin` book reader behind `probe(fen)`

## Landed outside the ladder

- ✅ `perf: walk the board only for a bot that reads attacks` — `EvalContext` builds `reach`/`pawnAttacks`/`attacksBy` behind prototype getters, so material, placement, proximity and symmetry never pay for `attacks` on thirty-two men. A material-only node goes 5.3 µs → 0.4, an animal's 6 µs → ~3, and `proximity` walks each army once for both kings instead of four times
- ✅ `perf: order moves and generate them without the wrappers` — insertion sort in place of an object per move and two arrays around a comparator (3.3 µs → 2.2 a node, and free in a position with no captures), and `legalMoves` walks piece by piece rather than through `allDests`, whose `Map` it threw away. Cumulative with the walk above: depth 2 ~2.8×, depth 3 ~4.6×, depth 2 sampling ~5.4×
- ✅ `engine: answer a check in quiescence` — the checked side was allowed to stand pat, so a leaf in check was priced as if it could stay there: White missed a back-rank Ra8+ winning a queen for a rook. Every evasion is searched now, capturing or not, bounded to one check per line; quiet checking moves stay out
- ✅ `bots: give a definition a base to be written on` — `zero`/`mate`/`material` as frozen literal weight records, so an animal's file is its idea and not seven repeated piece values; the Turtle is one line. Pinned by `bases.test.ts`, since a base is what bots on disk were written against
- ✅ `bots: price every animal in centipawns` — the roster valued a pawn at 20 so a behavioural weight could outweigh it, which left every animal's numbers comparable to nothing. Each vector is scaled so material reads at classical values instead; multiplying a whole vector by a constant changes no move an argmax bot plays, and all twenty roster pairings replay move for move
- ✅ `bots: one weight vector, not three phases` — no animal ever used the phase axis: every definition wrote `middlegame` and inherited the rest, and the sandbox applied one vector to all three. `PhaseWeights`, `interpolateWeights`, the evaluator's blend cache, `gamePhase`, the `Phase` type, the `all.`/`<phase>.` UCI scoping and the tuner's phase axis all go with it; a `setoption` now names a feature key and nothing else
- ✅ `perf: extract only the features a bot weighs` — `liveSlots` + `createExtractor` skip every family a bot leaves at zero, and `dot` walks the same sparse list. An animal's node goes 18 µs → ~6 µs and the whole search 3–4× faster; the random mover extracts nothing at all
- ✅ `eval: score mate in the search, not as a weight` — `terminalScore` replaces a finished game's evaluation with `MATE_SCORE - ply`, scaled by a `givesMate` preference in [-1, 1]. The old `givesMate: 100000` tied every mate regardless of distance and let a slow mate's leaf outbid a fast one on positional bonuses; every animal in the roster walked past a mate in one, and now none do
- ✅ `perf: speed up feature extraction` — 77 µs → ~18 µs against a 60 µs guard (5 µs proved unachievable; the target above was corrected to match)
- ✅ `perf: benchmark engine search` — `search.bench.ts` over depth 1/2/3 ± quiescence on a position spread, with a depth-2 budget guard in the suite mirroring the extraction guard
- ✅ `perf: prune the root when the bot only takes the argmax` — `temperature <= 0` searches root moves best-first with a narrowing window; ~14× at depth 2, ~10× at depth 3 + quiescence, and the scores a sampling bot reads stay exact
- ✅ `perf: reuse the blend and feature buffers across a search` — `createEvaluator` caches the phase-blended weights (≤25 distinct phases a game) and reuses one feature vector per search instead of allocating both per node
- ✅ `perf: generate only captures in quiescence` — `legalCaptures` builds the capture list straight from each piece's legal destinations rather than generating every move and filtering; quiescence no longer materialises the quiet moves it would only discard
- ✅ `perf: do not generate moves at a search leaf` — negamax checks depth before building the move list; a leaf just evaluates, and only quiescence still asks `hasLegalMove` (which short-circuits) to tell a mate from a quiet position. Cumulative over the five: depth 2 ~15×, depth 3 + quiescence ~11× on the spread
- ✅ `game: explain the move that produced the position`
- ✅ `game: report evaluations White-relative, in pawns`
- ✅ `eval: measure proximity per piece, not per army`
- ✅ `engine: search once per move, and honour the limits on go`
- ✅ `game: give every game its own engine seed`
- ✅ `ui: use amber sparingly, for state only`
- ✅ `ci: check every push and deploy main to Pages`
- ✅ `test: cover the bot engines, the worker transport and the mask helpers`
- ✅ `arena: shared worker pool, job cap, per-round progress`
- ✅ `bots: three more simple animals` — the Turtle, the Snake and the Shark; the roster listed weakest first, in arena order
- ✅ `bots: two-animal roster with a landing page` — the Donkey and the Wolf as data, `RosterView` as `/`
- ✅ `copy: skill for writing player-facing text`
- ✅ `copy: rewrite taglines, roster lead and bot blurbs`
- ✅ `game: remove the eval bar; unbreak the mobile roster lead`
