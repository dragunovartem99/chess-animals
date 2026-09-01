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
public/         favicon
paper.pdf       Elo World, the design's source
```

### Modules

| Module  | What it does                                                            |
| ------- | ----------------------------------------------------------------------- |
| `bots`  | the animal roster (`roster/*.ts`, plain data) and the per-bot page      |
| `game`  | `/play` — human vs bot, bot vs bot, move list, feature breakdown        |
| `board` | the chessground wrapper, orientation, legal dests, the promotion picker |
| `about` | the method and credit to the paper — placeholder, Phase G               |

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

| Area           | What it holds                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `chess`        | chessops wrappers — FEN in/out, legal moves, `afterMove`, repetition keys, game-over detection, and the tapered `gamePhase`      |
| `eval`         | the feature registry, the extractor and its families, feature/weight vectors, phase interpolation — the heart of the project     |
| `engine`       | negamax search, move ordering, quiescence, the move policy, the seeded RNG, the UCI codec, the engine client and its transports  |
| `bots`         | `BotDefinition` (JSON on disk) and `BotConfig` (compiled), the guard that validates one, and `compileBot` between them           |
| `openings`     | the curated paired opening set (JSON), `probe(fen)`, and the colour-swapped schedule                                             |
| `rating`       | Bradley–Terry MLE with a white advantage and Rao–Kupper draw term, CIs from the Hessian, and the Markov champion iteration       |
| `scheduler`    | the pure `runGame`, a `worker_threads` pool, the result cache, adaptive pairing, and `runTournament` over all of it              |
| `tuner`        | SPSA — the decaying gain sequences, the Rademacher perturbation, the ascent loop, and the bot-weights ↔ parameter-vector mapping |
| `test-support` | fixtures and helpers shared by specs — component mounting, played games, weight vectors, a fake worker                           |

`shared/bots` sits below both `eval` and `engine` in the dependency order rather than beside the
roster, because the worker and the cache key need to read a bot definition without pulling a Vue
component in with it.

## The evaluation

`shared/eval/extract.ts` reads every feature off one position in a single walk of the board, in
`createContext`, which hands each family the piece list with its attack sets already computed;
the families then do index and bitboard arithmetic only. Measured at **~18 µs**, with a 60 µs
regression guard asserted in the suite.

Everything is from the **side to move's** perspective, so no evaluation code is colour-specific
and a bot plays the same way with either colour.

The three weight sets are **interpolated** along the phase axis (`interpolateWeights`) rather
than switched between — a hard switch puts a step in the evaluation that bots shuffle back and
forth across. `gamePhase` is non-pawn material, 0 at the full board and 1 at bare kings, with the
middlegame set at the midpoint.

Feature keys are what a bot config stores, what a UCI `setoption` names, and what the locale
files key their labels on. Ids are assigned from registry order and never stored, so appending a
feature is safe and reordering one is not.

## The engine

`searchRoot` is negamax with alpha-beta; `depth` comes from the bot, `quiescence` extends past
the last ply along captures, and `nodeLimit` caps the work one move may cost (reaching it stops
the search going deeper rather than corrupting the result). Depth 1 short-circuits to scoring
every legal move.

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
