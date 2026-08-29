# chess-animals — implementation plan

## Context

This project is a Vue 3 app where **chess bots are animals with personalities**, each personality being nothing more than a set of tunable heuristic weights, and where comparing/tuning those bots is fast enough to be interactive.

The inspiration is Tom 7's _Elo World_ (SIGBOVIK 2019, `paper.pdf`): a tournament of dozens of deliberately weak or quirky players (`swarm`, `huddle`, `pacifist`, `cccp`, `min_oppt_moves`, `same_color`, `suicide_king`, …) rated against each other and against diluted Stockfish, to expand the dynamic range of chess ratings all the way down. The paper's own stated weaknesses are our design constraints:

- its Elo is _order-sensitive, k-sensitive and imbalance-sensitive_, needing 19 runs × 20 passes to stabilise → we fit ratings by maximum likelihood instead, which is order-free and instant;
- it needed _tens of thousands of CPU hours_ → we need seconds, so we buy variance reduction (paired openings, common random numbers, result caching) instead of buying games;
- it is _not robust against adding new players_ → our result cache is content-addressed, so adding a bot replays only that bot's games.

Architecture follows the sibling `chessdocs` repo (`ARCHITECTURE.md`, `CLAUDE.md`): self-contained `modules/<name>` with `components/ composables/ types/ utils/` and an `index.ts` barrel exporting only the public surface; anything two modules need lives in a `shared/<area>/` with its own `index.ts` and **no root barrel**; `shared/` depends on nothing else; `type` aliases not `interface`; single object parameters; tests colocated in `__tests__/`.

## Decisions taken

| Question         | Decision                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Personality      | One shared feature vector mixing **classical** and **behavioural** terms; a bot is 3 weight vectors over it                              |
| Search           | Negamax + alpha-beta, **depth is per-bot config, any ply**; depth 1 = pure greedy. Defaults stay shallow (1–3)                           |
| Rating           | **Bradley-Terry MLE** (+ white-advantage and draw parameters, CIs) with the paper's **Markov champion** distribution as a second opinion |
| Tuning           | **SPSA** auto-tuner over a frozen benchmark gauntlet, plus manual sliders                                                                |
| Board            | **chessground**; move generation/rules **chessops** (same pair chessdocs uses)                                                           |
| Engine transport | **UCI** over `postMessage`, so `stockfish.wasm` is a drop-in                                                                             |

---

## Layout

```
src/
  modules/
    arena/      tournament runner UI, cross-table heat map, rating table
    bots/       roster, weight editor, bot diff
    game/       play view — human vs bot, bot vs bot, eval breakdown
    board/      chessground wrapper
    tuner/      SPSA run UI, live score chart
    ui/         shared primitives
  shared/
    chess/      chessops helpers, game phase, move ordering, adjudication
    eval/       feature extraction + weight vectors   ← the heart of the project
    engine/     negamax search, UCI codec, worker protocol, engine clients
    rating/     Bradley-Terry MLE, Markov champion, Elo conversion
    scheduler/  worker pool, match scheduling, seeded PRNG, result cache
    openings/   paired opening set now, book interface for later
    tablebase/  interface only, unimplemented in v1
    test-support/
  locales/      ru/ en/  — UI strings, bot names, feature labels
  router/
  workers/      game-runner.worker.ts, uci-engine.worker.ts
PLAN.md
```

---

## 1. The feature vector (`shared/eval/`)

The single most important design choice: **every bot, serious or silly, is the same code path** — a dot product between a fixed-length feature vector and a weight vector.

```ts
type FeatureVector = Float32Array; // fixed length, index = feature id
type WeightVector = Float32Array; // same length

score = dot(features(position, move, state), weights[phase]);
```

Always from the **side to move's** perspective, so no colour-specific code and bots are symmetric by construction (the paper's third ground rule).

Three feature families are concatenated into one vector:

**A. Positional (classical)** — computed from the board in one pass:

- `material.{pawn,knight,bishop,rook,queen}` — 5 features, so _piece values are tunable per phase_ rather than hardcoded
- `bishopPair`, `rookOnOpenFile`, `rookOnSeventh`, `knightOutpost`, `badBishop`
- `centralization.{pawn,knight,bishop,rook,queen,king}`, `advancement.{…}` — a parametrised stand-in for piece-square tables (6+6 weights instead of 384; PSTs can be added later as a separate optional term)
- pawns: `doubled`, `isolated`, `backward`, `connected`, `passed`, `passedAdvancement`, `pawnShield`, `pawnIslands`
- king: `kingAttackers` (weighted attackers in the king zone), `kingRingControl`, `kingCentralization` (the endgame term), `kingPawnDistance`
- `mobility` and `safeMobility` per piece type, `spaceControl`, `centerControl`
- `hangingPieces`, `attackedByLesser`, `tempo`

**B. Behavioural (Elo World)** — the animal personalities, same mechanism:

| Feature                                                  | What it measures                               | Paper's player                  |
| -------------------------------------------------------- | ---------------------------------------------- | ------------------------------- |
| `swarm`                                                  | −Σ Chebyshev distance, own pieces → enemy king | `swarm`                         |
| `huddle`                                                 | −Σ Chebyshev distance, own pieces → own king   | `huddle`                        |
| `kingProximity`                                          | −distance between the two kings                | `suicide_king`                  |
| `sameColorSquares`                                       | own pieces standing on own-colour squares      | `same_color` / `opposite_color` |
| `symmetryMirrorY` / `symmetryMirrorX` / `symmetryRot180` | −penalty under the flip                        | `sym_*`                         |
| `reverseStarting`                                        | −Σ distance to the mirrored starting square    | `reverse_starting`              |
| `opponentMobility`                                       | −opponent legal move count                     | `min_oppt_moves`                |
| `pushDepth`                                              | how deep our pieces sit in enemy territory     | `cccp`'s P                      |
| `offeredMaterial`                                        | value of our pieces the opponent can capture   | `generous` / `no_i_insist`      |

**C. Move-level** — properties of the move that produced the position, so `cccp` and `pacifist` need no special casing:

`givesMate`, `givesCheck`, `captureValue`, `isPromotion`, `isCastle`, `movedPieceType`

**D. Stateful (optional, one flag on the bot)** — `equalizer`'s per-piece move counts and per-square visit counts. Kept behind `bot.stateful` so the common path stays a pure function.

Every feature is declared once in `shared/eval/features.ts` as `{ id, key, group, family, defaultWeight, i18nKey }`. That single registry drives: the extractor, the slider UI, the SPSA parameter space, the JSON schema for bot configs, and the locale files. **Adding a heuristic = adding one entry + one extractor line.** This is the scalability mechanism.

Extraction runs in one pass over a 64-entry board array with precomputed distance/attack tables; target **< 5 µs per position**.

---

## 2. Phases and weights (`shared/chess/phase.ts`)

Standard tapered phase from non-pawn material (24 → 0). Rather than switching hard between the three weight sets — which creates an eval discontinuity bots shuffle across — the effective weights are **interpolated**:

```ts
weights = lerp3({ opening, middlegame, endgame, phase });
```

Three sets stay fully configurable (that was the requirement); interpolation just removes the artefact. Phase thresholds are overridable per bot.

---

## 3. Engine (`shared/engine/`)

- `search.ts` — negamax + alpha-beta, `depth` from bot config (unbounded in principle, defaults shallow), optional quiescence on captures, optional node budget. `depth === 1` short-circuits to "score every legal move, pick the best".
- `policy.ts` — `temperature: 0` = argmax with random tie-break; `> 0` = softmax sample over move scores. This reproduces the paper's weighted-sampling `safe`/`popular`/`dangerous` players and, more importantly, stops deterministic bots from drawing every self-play game by repetition (the paper's `first_move` and `reverse_starting` problem).
- `rng.ts` — xorshift128, **seeded per game**. Every tournament is exactly reproducible.
- `uci/` — codec for the subset we need: `uci`, `isready`, `ucinewgame`, `setoption name … value …`, `position fen … moves …`, `go depth|nodes|movetime`, `stop`, `bestmove`, `info`. Each weight is exposed as a UCI option, so the tuner can retune a live engine without respawning the worker.
- `client.ts` — `createEngineClient({ kind: 'heuristic' | 'stockfish', config })` returning one `UciEngine` interface. Adding real Stockfish later is a new implementation of this interface and nothing else, because `stockfish.wasm` already speaks UCI over `postMessage`.

**Bot config** (`modules/bots/roster/*.ts`, plain data, versioned, validated by a guard in `shared/records/`):

```ts
type BotConfig = {
    id: string;
    name: LocalizedText; // { ru, en }
    animal: string; // emoji + species
    search: { depth: number; quiescence: boolean; nodeLimit?: number };
    policy: { temperature: number };
    weights: Record<Phase, WeightVector>;
    stateful?: boolean;
    useBook?: boolean; // reserved
    useTablebase?: boolean; // reserved
};
```

Starter roster: ~12 animals spanning the range — a pure random `Mouse`, `Swarm Wolf`, `Huddle Turtle`, `Pacifist Sloth`, `Magpie` (capture-greedy), `Boa` (min-opponent-moves), plus 3–4 genuinely competent tapered-weight bots at depths 1/2/3.

---

## 4. Running games fast (`shared/scheduler/`, `src/workers/`)

The speed requirement drives four choices:

1. **Whole games run inside a worker.** A worker receives `{ white, black, openingFen, seed, plyLimit }` and returns `{ result, plies, pgn? }`. No per-move main-thread round trip. Pool size = `navigator.hardwareConcurrency`.
2. **Paired openings.** Every opening is played twice with colours swapped. A curated set of ~50 balanced positions ships as JSON (`shared/openings/set.json`), behind the same `probe(fen)` interface a real Polyglot book will implement.
3. **Adjudication.** Repetition / 50-move / insufficient material via chessops; a ply cap (default 200) scores a draw; optional resign-on-decisive-eval to cut dead games short.
4. **Content-addressed result cache** in IndexedDB, keyed by `hash(whiteConfig, blackConfig, openingId, seed)`. Re-running a tournament after adding one bot plays only the new bot's games. Editing one weight invalidates only that bot's rows.

**Adaptive pairing** rather than a full round robin: pick the next pair whose game most reduces rating uncertainty (close current ratings × wide confidence intervals), and stop when every interval is under a threshold or the ordering has been stable for k games. This is what buys "ranking in seconds instead of thousands of games".

Target: a 12-bot pool ranked to ±40 Elo in **under 30 s** on 8 cores.

---

## 5. Rating (`shared/rating/`)

Pure functions over a win/loss/draw matrix, unit-tested against synthetic data with known ground truth.

- `fitBradleyTerry({ results })` — MM iterations to maximum likelihood, with a **white-advantage** term and a **draw** parameter (Rao–Kupper), plus a weak prior anchoring the mean to 1500 so an undefeated bot doesn't diverge to infinity. Converges in milliseconds; **order-independent and imbalance-robust**, which is precisely what the paper struggled with. Standard errors from the inverse Hessian diagonal give the confidence intervals the adaptive scheduler needs.
- `markovChampion({ matrix })` — the paper's trophy transition matrix, power-iterated to its stationary distribution. Shipped alongside the MLE as a second opinion, because the paper shows the two disagree in interesting places (`same_color`).
- `anchor.ts` — one bot pinned to a fixed rating so numbers are comparable across runs.
- `elo.ts` — score ↔ rating-difference conversion, and the paper's "comparable interpolated player" readout once diluted Stockfish exists.

---

## 6. Tuner (`modules/tuner/`)

SPSA over the weight vector of one phase (or all three jointly):

1. Draw a Rademacher perturbation δ; build candidates `w + cδ` and `w − cδ`.
2. Play both over the **same** gauntlet — same benchmark opponents, same openings, same seeds (common random numbers). The paired difference has a fraction of the variance of two independent measurements.
3. Update `w ← w + a · (score₊ − score₋)/(2c) · δ`, decaying `a` and `c`.
4. Live chart of gauntlet score per iteration; stop/resume; export the tuned bot as JSON.

Also wired: a single-feature hill climb, for answering "what is `mobility` actually worth here?"

Target: a useful tuning run in **1–2 minutes**.

---

## 7. App shell

Vue 3 + TS + Vite, `vue-router` with the locale in the path (`/:locale(ru|en)/…`), `vue-i18n` with `locales/ru` and `locales/en` — a missing key is a type error, not a silent fallback (chessdocs rule). Pinia only for the arena/tuner run state.

| Route                 | What it is                                                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                   | the animal roster with current ratings                                                                                                                        |
| `/bots` · `/bots/:id` | weight editor — three phase columns, sliders grouped by feature family, live eval readout on a board, diff against another bot                                |
| `/play`               | chessground board, human vs bot or bot vs bot, move list, eval bar, **per-feature contribution breakdown for the current position** (the main debugging tool) |
| `/arena`              | run a tournament, live cross-table heat map (the paper's Figure 11), rating table with CIs, champion probabilities                                            |
| `/tuner`              | SPSA runs                                                                                                                                                     |
| `/about`              | the method, and credit to the paper                                                                                                                           |

Bot names, descriptions and every feature label are localised; `shared/eval/features.ts` supplies the i18n keys so a new heuristic surfaces in both languages at once.

---

## 8. Designed-for, not built in v1

- **Opening book** — `shared/openings/book.ts` already defines `probe(fen) → weighted moves`; v1 backs it with the curated JSON set, v2 with a Polyglot `.bin` reader. `bot.useBook` exists from day 1.
- **Endgame tablebase** — `shared/tablebase/index.ts` defines `probe(fen) → { wdl, dtz, moves }`; simplest v2 backing is the free lichess 7-man HTTP API with an IndexedDB cache, later syzygy WASM. `bot.useTablebase` exists from day 1.
- **Real Stockfish** — a second implementation of `UciEngine`. Unlocks the paper's **dilution ladder**: Stockfish playing a random move 1-in-N of the time gives calibrated reference points at _every_ rating level, which is how the whole scale gets absolute meaning rather than being self-referential.

---

## Commit ladder

Work proceeds one commit at a time. **Every commit leaves the repo green** — types, lint, tests — and does one thing, so each is reviewable on its own and revertable without unpicking the next. I stop after each commit for review before starting the following one.

Commit messages: `<area>: <what>`, e.g. `eval: add pawn structure features`.

### Phase A — foundations

| #   | Commit                              | Contents                                                                                                                             | Green when                                                           |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| 1   | `chore: scaffold vite + vue 3 + ts` | `package.json`, Vite, TS config, oxlint/oxfmt, vitest, `.gitignore`, empty `src/`                                                    | `npm run dev` serves a blank page; `npm test` passes with zero tests |
| 2   | `docs: add PLAN.md`                 | This document, committed as the project's design record                                                                              | —                                                                    |
| 3   | `chore: router + i18n shell`        | `vue-router` with `/:locale(ru\|en)`, `vue-i18n`, `locales/ru`, `locales/en`, a locale switcher, placeholder routes                  | Both locales render; unknown locale redirects                        |
| 4   | `shared/chess: position helpers`    | chessops wrappers — FEN in/out, legal moves, game-over detection, repetition/50-move/insufficient material, `phase.ts` tapered phase | Unit tests over hand-written FENs                                    |
| 5   | `shared/engine: seeded rng`         | xorshift128, `nextInt`, `pick`, `softmaxSample`                                                                                      | Same seed → same sequence, asserted                                  |

### Phase B — the eval, the actual product

| #   | Commit                                  | Contents                                                                                                                                                              | Green when                                                 |
| --- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 6   | `eval: feature registry + vector types` | `features.ts` registry (id, key, group, family, defaultWeight, i18nKey), `FeatureVector`/`WeightVector` types, `dot`, `lerp3` phase interpolation, an empty extractor | Registry ids are unique and dense; lerp3 tested            |
| 7   | `eval: material and mobility features`  | The first real extractor pass — 5 material features, mobility, safeMobility, tempo                                                                                    | Extractor tested on FENs with known material/mobility      |
| 8   | `eval: positional features`             | Centralization/advancement, rook on open file/seventh, bishop pair, outpost, space, center control, hanging                                                           | Per-feature tests                                          |
| 9   | `eval: pawn structure features`         | Doubled, isolated, backward, connected, passed, passedAdvancement, pawn shield, islands                                                                               | Per-feature tests                                          |
| 10  | `eval: king safety features`            | King zone attackers, ring control, king centralization, king-pawn distance                                                                                            | Per-feature tests                                          |
| 11  | `eval: behavioural features`            | swarm, huddle, kingProximity, sameColorSquares, the three symmetries, reverseStarting, opponentMobility, pushDepth, offeredMaterial                                   | Each asserted against a position where its sign is obvious |
| 12  | `eval: move-level features`             | givesMate, givesCheck, captureValue, isPromotion, isCastle, movedPieceType                                                                                            | Tested through a move list                                 |
| 13  | `perf: benchmark feature extraction`    | A bench script + an asserted budget                                                                                                                                   | Extraction under 5 µs/position                             |

### Phase C — bots that play

| #   | Commit                          | Contents                                                                                               | Green when                                                              |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| 14  | `engine: depth-1 greedy policy` | Score every legal move, argmax with seeded tie-break; `temperature` softmax path                       | A bot plays a full legal game headlessly                                |
| 15  | `engine: negamax + alpha-beta`  | Configurable depth (any ply), move ordering, optional quiescence, node budget                          | Depth 2 beats depth 1 from the same weights, asserted over paired games |
| 16  | `bots: config type + roster`    | `BotConfig`, its guard, first three animals (`Mouse`, `Swarm Wolf`, `Huddle Turtle`) as data files     | Roster validates; each bot plays a legal game                           |
| 17  | `engine: UCI codec`             | Parser/serializer for the subset, weights exposed as `setoption`                                       | Round-trip tests on every message form                                  |
| 18  | `engine: worker client`         | `uci-engine.worker.ts`, `createEngineClient`, the `UciEngine` interface Stockfish will later implement | A bot answers `go depth 2` from a worker                                |

### Phase D — playing it

| #   | Commit                          | Contents                                                         | Green when                                   |
| --- | ------------------------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| 19  | `board: chessground wrapper`    | Board component, orientation, legal-move dests, promotion dialog | Board renders and accepts a human move       |
| 20  | `game: play view`               | `/play` — human vs bot, bot vs bot, move list, eval bar          | A game is playable end to end in the browser |
| 21  | `game: feature breakdown panel` | Per-feature contribution table for the current position          | Numbers sum to the reported eval             |

### Phase E — the arena

| #   | Commit                                 | Contents                                                                                                          | Green when                                                                                       |
| --- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 22  | `openings: paired opening set`         | ~50 curated balanced positions as JSON, behind the `probe(fen)` book interface                                    | Set loads; colour-swapped pairing tested                                                         |
| 23  | `rating: bradley-terry MLE`            | MM fit with white-advantage, draw parameter, prior anchor, CIs from the Hessian                                   | Recovers known ratings from a synthetic matrix; stable under deliberately imbalanced pair counts |
| 24  | `rating: markov champion`              | Trophy transition matrix, power iteration                                                                         | Known stationary distribution recovered                                                          |
| 25  | `scheduler: worker pool + game runner` | `game-runner.worker.ts` runs whole games in-worker; pool sized to `hardwareConcurrency`; ply cap and adjudication | 1000 games run in parallel and reproduce from seed                                               |
| 26  | `scheduler: result cache`              | Content-addressed IndexedDB cache keyed by `hash(white, black, openingId, seed)`                                  | Adding a bot replays only that bot's games                                                       |
| 27  | `scheduler: adaptive pairing`          | Pick the pair that most reduces rating uncertainty; stop on CI threshold or stable ordering                       | 12-bot pool to ±40 Elo in under 30 s                                                             |
| 28  | `arena: tournament view`               | `/arena` — run control, live cross-table heat map, rating table with CIs, champion probabilities                  | Cross-table matches the rating order                                                             |

### Phase F — tuning

| #   | Commit                | Contents                                                                                                  | Green when                                     |
| --- | --------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 29  | `bots: weight editor` | `/bots/:id` — three phase columns, sliders grouped by family, live eval readout, diff against another bot | Edits change play immediately                  |
| 30  | `tuner: SPSA core`    | Rademacher perturbation, paired gauntlet with common random numbers, decaying `a`/`c`                     | Measurably improves a deliberately detuned bot |
| 31  | `tuner: run UI`       | `/tuner` — live score chart, stop/resume, export tuned bot as JSON                                        | A run completes in 1–2 minutes                 |

### Phase G — finishing

| #   | Commit                       | Contents                                                                        | Green when                                                |
| --- | ---------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 32  | `bots: full animal roster`   | ~12 animals spanning the range, RU/EN names and descriptions                    | Ordering matches the paper's intuition (see Verification) |
| 33  | `test: golden games`         | Fixed pair + seed + opening → committed PGN fixtures                            | Any eval change surfaces as a diff                        |
| 34  | `docs: about page + README`  | `/about` explaining the method and crediting the paper; README                  | Both locales complete                                     |
| 35  | `tablebase: probe interface` | `probe(fen) → { wdl, dtz, moves }` stub, `bot.useTablebase` honoured as a no-op | Interface compiles and is unit-tested against a fake      |

Stockfish-as-`UciEngine` and the Polyglot book reader are the natural commits 36–37, outside v1.

---

## Verification

- **Unit** (`vitest`, colocated `__tests__/`): feature extractor against hand-checked FENs; phase interpolation; `fitBradleyTerry` recovering known ratings from a synthetic matrix (within tolerance) and staying stable under a deliberately imbalanced pairing count; `markovChampion` on a matrix with a known stationary distribution; UCI codec round-trips.
- **Golden games**: fixed bot pair + fixed seed + fixed opening → fixed PGN, committed as a fixture. Any eval change that shifts a game shows up as a diff, which is the cheapest possible regression net for a heuristic engine.
- **Determinism**: run the same tournament seed twice, assert identical rating tables.
- **Behavioural sanity**: `Swarm Wolf` beats `Mouse` (random) well over 90% of paired games; `Pacifist Sloth` draws far more than it wins — matching the paper's ordering is the strongest signal the features are right.
- **Performance**: benchmark script asserts feature extraction < 5 µs/position and a full 12-bot ranking under the 30 s budget.
- **Manual**: `npm run dev`, play a bot at `/play` and confirm the feature breakdown explains its moves; run `/arena` and confirm the cross-table matches the rating order; run `/tuner` and confirm the gauntlet score trends up; switch RU↔EN on every route.
