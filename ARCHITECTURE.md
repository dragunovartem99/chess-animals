# ARCHITECTURE.md

How the app is built. Why the numbers mean anything — the paper, the feature vector, the rating
fit — is in [METHOD.md](./METHOD.md); the conventions the code holds itself to are in
[CLAUDE.md](./CLAUDE.md); what is built and what is next is in [PLAN.md](./PLAN.md).

## Layout

```
src/
  app/          router, i18n, the layout shell and the locale switcher
  modules/      feature modules (see below) — each with an index.ts barrel
  shared/       primitives more than one module needs; depends on nothing above it
  locales/      ru/ en/ — UI strings, bot names, feature labels
  workers/      uciEngine.worker.ts
cli/            dev CLIs — the tournament runner and the SPSA tuner (run with tsx)
public/         favicon
paper.pdf       Elo World, the design's source
```

### Modules

| Module         | What it does                                                                                                                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bots`         | the animal roster (`roster/*.ts`, plain data) and its landing page                                                                                                                                                |
| `game`         | `/play` — human vs bot, bot vs bot, move list, feature breakdown                                                                                                                                                  |
| `board`        | the chessground wrapper, orientation, legal dests, the promotion picker                                                                                                                                           |
| `frankenstein` | `/frankenstein` — a live weight/depth sandbox: one weight vector across every feature, an in-thread UCI engine tuned by `setOption` (no restart), autoplay, seeding from a roster animal or the registry defaults |
| `about`        | the method and credit to the paper — placeholder, Phase G                                                                                                                                                         |

The tournament runner and the SPSA tuner are **dev CLIs under `cli/`**, not modules — they need
every core and have no place in the shipped app. The rating, scheduler and tuner math they drive
lives in `shared/rating`, `shared/scheduler` and `shared/tuner` as pure functions; the CLI is a
thin Node shell (run with `tsx`) over a `worker_threads` pool. `npm run arena` rates the whole
roster over the paired opening set, printing the rating table and cross-table and writing
`arena-results.json`; the same `--seed=` reproduces it exactly, and the result cache means a new
bot only replays its own games. `npm run tune -- <botId>` runs SPSA on one bot's weights against
the rest of the roster as a gauntlet, printing the score each iteration and writing
`<botId>-tuned.json` if the run improved it.

Every `modules/<name>` is self-contained: `components/`, `composables/`, `utils/`, and an
`index.ts` exporting only the public surface. Internals are never imported from outside the
module — the router itself reaches a view only through the barrel
(`import("../modules/game").then((m) => m.PlayView)`), which is also what makes each module its
own lazy chunk.

### Shared

One flat area per folder, each with its own `index.ts`, and deliberately **no root barrel**.
`shared/` depends on nothing else in the repo.

| Area           | What it holds                                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chess`        | chessops wrappers — FEN in/out, legal moves, `afterMove`, the search's per-ply scratch positions, repetition keys and hashes, and game-over detection |
| `eval`         | the feature registry, the extractor and its families, feature and weight vectors, terminal scoring — the heart of the project                         |
| `engine`       | negamax search, move ordering, quiescence, the move policy, the seeded RNG, the UCI codec, the engine client and its transports                       |
| `bots`         | `BotDefinition` (JSON on disk) and `BotConfig` (compiled), the frozen weight bases, the guard, and `compileBot` between them                          |
| `openings`     | the curated paired opening set (JSON), `probe(fen)`, and the colour-swapped schedule                                                                  |
| `rating`       | Bradley–Terry MLE with a white advantage and Rao–Kupper draw term, CIs from the Hessian, and the Markov champion iteration                            |
| `scheduler`    | the pure `runGame`, a `worker_threads` pool, the result cache, adaptive pairing, and `runTournament` over all of it                                   |
| `tuner`        | SPSA — the decaying gain sequences, the Rademacher perturbation, the ascent loop, and the bot-weights ↔ parameter-vector mapping                      |
| `test-support` | fixtures and helpers shared by specs — component mounting, played games, weight vectors, a fake worker                                                |

`shared/bots` sits below both `eval` and `engine` in the dependency order rather than beside the
roster, because the worker and the cache key need to read a bot definition without pulling a Vue
component in with it.

## The evaluation

`shared/eval/extract.ts` reads the features off one position in a single walk of the board, in
`createContext`, which hands each family the piece list with its attack sets worked out once;
the families then do index and bitboard arithmetic only. Reading all sixty-odd measures
**~18 µs**, with a 60 µs regression guard asserted in the suite.

That walk is **lazy**, because it is most of the cost and most bots never need it: `reach`,
`pawnAttacks` and `attacksBy` are prototype getters that call `attacks` on all thirty-two men the
first time one of them is read, and never if none is. A material-only evaluation went 5.3 µs a
node to 0.4. (Prototype getters, not accessors in an object literal — those are own properties
built per instance and cost more than the walk they were meant to avoid.)

A search does not read all sixty-odd. A weight of zero cannot change a score, so `liveSlots`
reads the bot's weight vector once per `go` and `createExtractor` runs only
the families that union touches — the dot product then walks the same list instead of multiplying
fifty-odd zeros. An animal names a handful of features, which is **~3 µs** a node and a 3–5×
faster search; `cccp` reads only the move and never builds the context at all; the random mover
extracts nothing. Each family declares the slots it writes next to its extractor, and the suite
holds every family to writing exactly those.

Everything is from the **side to move's** perspective, so no evaluation code is colour-specific
and a bot plays the same way with either colour.

Feature keys are what a bot config stores, what a UCI `setoption` names, and what the locale
files key their labels on. Ids are assigned from registry order and never stored, so appending a
feature is safe and reordering one is not.

## The engine

`searchRoot` is negamax with alpha-beta, and `leaf.ts` is what happens once it stops descending —
the evaluation, quiescence and the node budget, which is a property of leaves because a leaf is
the only thing that spends one. `depth` comes from the bot, `quiescence` extends past
the last ply along captures, and `nodeLimit` caps the work one move may cost (reaching it stops
the search going deeper rather than corrupting the result). Depth 1 short-circuits to scoring
every legal move.

Captures it cannot afford are not searched at all. If the standing score plus the piece on offer
plus a two-pawn margin still fails to reach `alpha`, the capture is skipped — a pawn is not worth
looking at while a rook down. The piece is priced from the bot's _own_ material and `captureValue`
weights, so a Snake that thinks a rook beats a queen prunes by its own values and a bot weighing
no material at all gets a bound of zero, which is the truth: captures cannot move a score that
does not count them. The margin is the wager, since a capture moves mobility and king safety too
and nothing bounds those; it is worth about 15% of a search with quiescence on.

Quiescence stands pat and then searches captures — except in check, where there is nothing to
stand on: the side to move may not decline, so **every** evasion is searched, not only the ones
that capture. That extension is worth one check per line (`EVASION_BUDGET`); unbounded, a
checking sequence never shrinks the move list and the benchmark ran 2.5× slower. Quiet moves that
_give_ check are not searched at all — the other half of what "quiescence with checks" usually
means, and the half no depth-2 animal is going to follow up on.

Mate is the one thing that is **not** a term in the dot product. `terminalScore` replaces the
evaluation of a finished game with `MATE_SCORE - ply`, scaled by `givesMate` — a preference in
[-1, 1] where +1 chases mate, -1 flees it and 0 cannot see one, in which case the position is
evaluated like any other. `givesStalemate` works the same way on the same scale. Adding mate to
the evaluation instead, as a weight of 100000, was wrong twice over: every mate scored the same
whatever its distance, and the leaf of a slow mate then collected plies of positional bonus on
top of it, so every animal in the roster walked past a mate in one.

A draw is the other thing the search must see for itself, and the one it used to be blind to.
`createDrawTest` scores a repetition, the fifty-move rule and insufficient material at a flat
zero, before the position is evaluated and before its moves are generated — the game does not go
on from there. Unlike mate this is not a preference: zero is the honest price of splitting the
point, because every feature is a difference between the sides, so a level position already scores
near it. Without it a bot two queens up would shuffle back into a position it had already drawn
twice and score it as winning.

The history comes from whoever owns the game — `runGame` in the arena, `position … moves` over
UCI — as a `Repetition`, a stack of 64-bit position hashes the search pushes its own ancestors
onto. Hashes rather than the exact FEN `repetitionKey` the game-level rule uses, because a string
per node is what the search cannot afford; the hash is only computed once `halfmoves` says a
repetition is reachable at all, which is most of why knowing about draws costs 2–4%.

`policy.ts` turns those scores into a move: `temperature: 0` is a strict argmax with a seeded
tie-break, above it a softmax sample. All randomness comes from `createRng` — xorshift128, seeded
per game — so a game replays exactly from its seed.

### Everything speaks UCI

```
PlayView ─ useBotEngines ─ UciEngineClient ─ UciTransport ─┬─ Worker ── uciEngine.worker.ts
                                                            └─ local (same thread, for tests)
```

`UciTransport` is a line-oriented pipe: `send`, `subscribe`, `dispose`. `createWorkerTransport`
wraps a `Worker`, and `createLocalTransport` runs the same engine in this thread, so a test can
exercise the whole protocol without spawning anything. `stockfish.wasm` already posts UCI lines
over `postMessage` and would be a third transport needing no adapter.

`createUciEngine` holds the state a UCI session has — the bot, the current position, the RNG —
and is a pure function of commands to responses, which is why the worker is almost empty: it owns
a bot and a pipe and delegates everything else. Its first message is the bot definition; every
message after it is a UCI line.

Each weight is exposed as a `setoption`, so a tuner can retune a live engine without respawning
the worker.

## App shell

`vue-router` with the locale in the path, `/:locale(ru|en)/…` over roster, `/bots/:id`, `/play`,
`/about`. Anything without a known locale prefix is re-entered under the
reader's own locale rather than 404ing; a path that still matches nothing falls back to that
locale's root, which keeps a typo like `/xx/play` from redirecting onto itself forever.

`vue-i18n` with `locales/ru` and `locales/en`, typed against `locales/types.ts` — a missing key
is a type error, not a silent fallback, and `locales/__tests__/coverage.test.ts` holds the two
sets to each other. Bot names and descriptions live there under `bot.<id>`, feature labels under
`feature.<key>` from the registry's `i18nKey`, so a new animal or heuristic is
untranslatable-by-accident rather than silently English-only.

## Checks and deployment

`npm run build` type-checks with `vue-tsc` before Vite builds. CI (`.github/workflows/ci.yaml`)
runs format, types, lint, tests with coverage, and the build on every push and pull request
against `main`.

Push to `main` also triggers `.github/workflows/deploy.yaml`, which calls the shared
[pipes](https://github.com/dragunovartem99/pipes) workflow to publish `dist/` to GitHub Pages.
Pages serves the repo under a sub-path and knows nothing about the router, so `vite.config.ts`
sets `base: "/chess-animals/"` and a `spaFallback` plugin copies `index.html` to `404.html` —
Pages hands deep links to that file, and the router takes the url from there.
