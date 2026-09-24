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
engine/         the C search and evaluation, built to wasm and natively for tests (`make -C engine`)
cli/            dev CLIs — the tournament runner and the SPSA tuner (run with tsx); lab.ts stages
                candidate bots for `arena -- --lab`
public/         favicon
paper.pdf       Elo World, the design's source
```

### Modules

| Module  | What it does                                                                                  |
| ------- | --------------------------------------------------------------------------------------------- |
| `bots`  | the two rosters — land and monsters (`roster/*.ts`, plain data) — and a landing page for each |
| `game`  | `/play` — human vs bot, bot vs bot, the move list with history navigation, PGN copy           |
| `board` | the chessground wrapper, orientation, legal dests, the promotion picker                       |
| `about` | `/about` — a short prose page: how the bots work, the paper it comes from, credit             |

The tournament runner and the SPSA tuner are **dev CLIs under `cli/`**, not modules — they need
every core and have no place in the shipped app. The rating, scheduler and tuner math they drive
lives in `shared/rating`, `shared/scheduler` and `shared/tuner` as pure functions; the CLI is a
thin Node shell (run with `tsx`) over a `worker_threads` pool. `npm run arena` rates the whole
roster over the paired opening set, printing the rating table and cross-table and writing
`arena-results.json`; the same `--seed=` reproduces it exactly, and the result cache means a new
bot only replays its own games. The cache is kept per `engine.wasm` build, so a rebuilt engine
replays everything once. It also writes the site's numbers, `src/modules/bots/roster/points.json`,
committed: the fitted ratings shifted until the underwater animals sit, on average, at the Elo Maia
was asked to play them at, so a bot's points read roughly as a person's rating (`toPoints`). `npm run tune -- <botId>` runs SPSA on one bot's weights against
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

| Area           | What it holds                                                                                                                                                                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chess`        | chessops wrappers — FEN in/out, legal moves, `afterMove`, repetition keys, and game-over detection                                                                                                                                                               |
| `eval`         | the feature registry, feature and weight vectors, `MATE_SCORE` — what a bot is, where `engine/` is what it does                                                                                                                                                  |
| `engine`       | the seeded RNG, the UCI codec, the UCI engine over a `goSearch`, the engine client and its transports                                                                                                                                                            |
| `monsters`     | the monsters: Stockfish over a `UciTransport`, and the engine that samples its MultiPV lines                                                                                                                                                                     |
| `underwater`   | Maia: the board as its tokens, the legal moves as its logits, the pick from the seeded stream, the ONNX session and `withMaia` for the arena                                                                                                                     |
| `wasm`         | the binding to `engine/build/engine.wasm` — loading, the linear-memory arena, `search`/`extract`/`perft`, and the `goSearch` over it                                                                                                                             |
| `talk`         | what the animals say: the Stockfish observer and its verdicts from White's view, the win chance, the eval swings worth a remark, who answers one with what, what a move took or checked, and the conversation that picks the seeded lines and keeps the cooldown |
| `game`         | `useGame` — one game with its move list, positions and repetition history, owned by the view that mounts it (`/play`)                                                                                                                                            |
| `ui`           | `useTheme` — the world a view puts the page in                                                                                                                                                                                                                   |
| `bots`         | `BotDefinition` (JSON on disk) and `BotConfig` (compiled), the frozen weight bases, the guard, and `compileBot` between them                                                                                                                                     |
| `openings`     | the curated paired opening set (JSON), `probe(fen)`, and the colour-swapped schedule                                                                                                                                                                             |
| `rating`       | Bradley–Terry MLE with a white advantage and Rao–Kupper draw term, CIs from the Hessian, and the Markov champion iteration                                                                                                                                       |
| `scheduler`    | the pure `runGame`, a `worker_threads` pool, the result cache, adaptive pairing, and `runTournament` over all of it                                                                                                                                              |
| `tuner`        | SPSA — the decaying gain sequences, the Rademacher perturbation, the ascent loop, and the bot-weights ↔ parameter-vector mapping                                                                                                                                 |
| `test-support` | fixtures and helpers shared by specs — the wasm engine, component mounting, played games, weight vectors, a fake worker                                                                                                                                          |

`shared/bots` sits below both `eval` and `engine` in the dependency order rather than beside the
roster, because the worker and the cache key need to read a bot definition without pulling a Vue
component in with it.

## The evaluation

Search and evaluation are C compiled to WebAssembly, in `engine/`: freestanding clang
`--target=wasm32`, no libc and no Emscripten, so the module is tens of KB with no JS glue and
`WebAssembly.instantiate` loads it straight from a worker. The same sources build natively for
the C suite under ASan + UBSan and llvm-cov, and for `npm run engine:bench`. chessops stays for
everything that is not the hot path: the board's legal destinations, FEN/SAN/PGN, and the
game-level outcome and repetition in `useGame` and `runGame`.

The registry is still TS and still the single source. `cli/featuresHeader.ts` generates
`engine/include/feature_ids.h` from `features.ts` — the ids, and the keys the bench prints — and a
spec fails while the committed header is stale. A feature is one C function in
`engine/src/eval/`, entered in the `EXTRACTORS` table by its id; the files group them by what they
read, for the reader only.

A search does not read every feature. A weight of zero cannot change a score, so `evaluator`
reads the bot's weights once per search and keeps the slots it weighs with their extractors, and a
node runs exactly those — a material-only node is a few nanoseconds, where running every feature
is ~380 ns. What more than one feature reads, the attack maps, sits in a lazy context whose walk
runs the first time a feature asks and never if none does. `npm run engine:bench` prints the
cost of each feature on top of that walk.

Everything is from the **side to move's** perspective, so no evaluation code is colour-specific
and a bot plays the same way with either colour.

Mate is the one thing that is **not** a term in the dot product. `terminal_score` replaces the
evaluation of a finished game with `MATE_SCORE - ply`, scaled by `givesMate` — a preference in
[-1, 1] where +1 chases mate, -1 flees it and 0 cannot see one, in which case the position is
evaluated like any other. Adding mate to the evaluation instead, as a weight of 100000, was wrong
twice over: every mate scored the same whatever its distance, and the leaf of a slow mate then
collected plies of positional bonus on top of it, so every animal in the roster walked past a
mate in one.

Feature keys are what a bot config stores, what a UCI `setoption` names, and what the locale
files key their labels on. Ids are assigned from registry order and never stored, so appending a
feature is safe and reordering one is not.

## The engine

The browser's `uciEngine` worker and the arena's game workers — so the
tuner's games too — all load the one module. It is called coarsely, never per node:
`search({ fen, moves, weights, options, rngState })` returns the move, its score, the node count
and the advanced random state; C replays the move history into its own Zobrist stack, so it sees
every repetition the game has been through. UCI parsing, transports and workers stay TS and stay
thin, handing the search to `createUciEngine` and `runGame` as a `goSearch`.

The search is fail-soft alpha-beta with PVS and iterative deepening to the bot's depth. A
transposition table orders moves only — the table move first, never a cutoff, so a repetition
cannot make a score depend on the path — then captures by MVV-LVA, then the quiet moves by
killers and a depth-squared history table. The stages are generated lazily, so a node that cuts
on a capture never lists its quiet moves, and quiescence out of check lists only the noisy ones.
Null move, LMR, futility and razoring are **out**: they assume a sane evaluation, and an animal's
is not; a Sloth's `huddle` score is exactly what null move would mis-prune. `nodeLimit` plays the
best move of the last depth it finished.

Quiescence stands pat and searches captures, promotions and en passant — and in check every
evasion, since the side to move may not decline. A capture that could not lift the standing score
to `alpha` even with the piece free and a two-pawn margin is skipped, the piece priced at the
bot's _own_ material and `captureValue` weights: a bot weighing no material gets a bound of zero,
which is the truth.

A repetition (twofold inside the tree), the fifty-move rule, insufficient material and stalemate
all score a flat zero before the position is evaluated. Zero is the honest price of splitting the
point, because every feature is a difference between the sides; without it a bot two queens up
would shuffle back into a position it had already drawn twice.

A move is always the argmax, the tie between equal moves broken by a shuffle of the root from
xorshift128. The stream's state crosses every search and comes back advanced, so one stream runs
through a whole game and it replays exactly from its seed.

C17, `-O3 -flto`, clang-tidy and clang-format in `lint:check` and `format:check`, and the
100-line rule per file. No allocation after init: move lists live on the stack, the undo record
per ply, and the tables are built once. The C suite checks move generation and perft against
chessops fixtures, the search against itself — PVS equal to alpha-beta equal to plain minimax,
deepening equal to a fixed depth — and every feature and every roster animal's score against
`features.txt` and `evals.txt`, the TS code's answers frozen when it was retired. The bench prints
a **signature**, the total nodes over the roster: a speed-only change leaves it alone, and a
commit that moves it says why.

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

### Monsters

A second roster, `MONSTERS` beside `ROSTER`, of **Stockfish alone, softened**. A monster is a bot
definition with no weights and `stockfish: { nodes, lines, temperature }`; its `search` is never
read. On every move `createMonsterEngine` asks Stockfish for its best `lines` moves (MultiPV) on
`nodes` nodes and picks one, a line `d` centipawns behind the best weighted `exp(-d / temperature)`.
Small slips are common and blunders rare, which reads as a person playing — a uniformly random
move, the paper's dilution, hangs a queen out of the blue. The pick is drawn from a seeded stream
of its own, so a game replays from its seed. The sixteen differ in temperature alone, bar
the Dragon, which also sees ten times as far; the hottest reach down towards the Tiger. They were sea
creatures on `/underwater` once; the fish ids are free again for Maia's animals there.

The engine is the land engine with a `go` that asks Stockfish instead, so the play view cannot
tell them apart; its answers are promises, because Stockfish is a process. In the browser the
worker starts Stockfish as a second worker from `public/stockfish/` — the vendored 1.8 MB
lite single-threaded build, fetched by the first monster that plays, never by the land roster —
and Chess960 notation is switched on so castling is king-takes-rook in both engines. Outside a browser
`createProcessTransport` runs the same script as a child process, started on the first line sent.
The arena plays monsters through `createMover`, which makes the same pick from a game's own
random stream and is why `runGame` is async; each game worker owns one Stockfish, cleared per game,
and the result cache keys a game with a monster in it on the Stockfish build too. The sixteen
are rated in the same table as the land roster.

### Underwater animals

A third roster, `UNDERWATER`, of **Maia alone** — a transformer trained to play the move a person
at a given rating would. An underwater animal is a bot definition with no weights and
`maia: { elo, greedy? }`; each move the board goes in as 64×12 tokens (flipped when Black is to
move, since Maia only sees White's side), 4352 logits come out, the legal ones are softmaxed, and
the move is drawn from the seeded stream — or, `greedy`, the likeliest is played. The sixteen
differ in `elo` alone, bar the Whale, the one greedy animal.

The model is vendored at `public/maia3/`, 46 MB, with its AGPL-3.0 licence beside it, and run by
`onnxruntime-web` in the browser and under node alike (`onnxruntime-node` segfaults loading it).
The runtime and the model load on the first underwater move: the worker's `isready` waits for
them, so the board's loading state covers the download, and the land and monster rosters never
fetch either. The arena plays them through `withMaia` in front of `createMover`, and the result
cache keys a game with one in it on the model's digest.

The pages follow the roster they show: `useTheme` in `shared/ui` lets a view say which world it is
in, and the layout paints the document — the monsters' theme (violet squares, a
slime-green highlight, a purple button) on `/monsters`, and on `/play` while a monster is at the board.

## App shell

`vue-router` with the locale in the path, `/:locale(ru|en)/…` over roster, `/bots/:id`, `/play`,
`/about`. Anything without a known locale prefix is re-entered under the
reader's own locale rather than 404ing; a path that still matches nothing falls back to that
locale's root, which keeps a typo like `/xx/play` from redirecting onto itself forever.

`vue-i18n` with `locales/ru` and `locales/en`, typed against `locales/types.ts` — a missing key
is a type error, not a silent fallback, and `locales/__tests__/coverage.test.ts` holds the two
sets to each other. Bot names and descriptions live there under `bot.<id>`, what a bot says under
`talk.<id>.<remark>` — a file per animal, since every remark has its lines — feature labels under
`feature.<key>` from the registry's `i18nKey`, so a new animal or heuristic is
untranslatable-by-accident rather than silently English-only.

## Checks and deployment

`npm run build` type-checks with `vue-tsc` before Vite builds. CI (`.github/workflows/ci.yaml`)
runs format, types, lint, tests with coverage, and the build on every pull request against `main`.

Push to `main` runs `.github/workflows/deploy.yaml`, which reuses CI as a gate and then ships
`dist/` to the VPS that also serves the author's other sites. Each deploy is rsynced into its own
release directory and activated by atomically swapping a symlink, so the two previous releases
stay on disk for rollback. `deploy.sh` installs the repo's `Caddyfile` as this site's block and
reloads Caddy; the block sends every path that is not a file to `index.html`, which is how deep
links reach the router.
