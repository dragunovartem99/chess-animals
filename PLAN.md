# PLAN.md

What lands next. Why the project is shaped this way is in [METHOD.md](./METHOD.md), how it is
built in [ARCHITECTURE.md](./ARCHITECTURE.md), the conventions in [CLAUDE.md](./CLAUDE.md).

One commit at a time, each does one thing, and **every commit leaves the repo green** — format,
types, lint, tests, build.

| Commit                          | Contents                                                                        | Green when                                          |
| ------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------- |
| ⬜ `test: golden games`         | Fixed pair + seed + opening → committed PGN fixtures                            | Any eval change surfaces as a diff                  |
| ⬜ `tablebase: probe interface` | `probe(fen) → { wdl, dtz, moves }` stub, `bot.useTablebase` honoured as a no-op | The interface compiles and is tested against a fake |

## The C engine

Search and evaluation move to C compiled to WebAssembly. chessops stays for everything that is
not the hot path: chessground dests, FEN/SAN/PGN, game-level outcome and repetition in `useGame`
and `runGame`. The TS search and extractor are the **reference oracle** while the port lands and
are deleted at cutover: one implementation, never two drifting.

Measured today (`npm run bench`, material-only weights, argmax): depth 2 ≈ 1.75 ms, depth 3 ≈
7.8 ms, depth 3 + quiescence ≈ 43 ms per pass; full extraction ≈ 37 µs a position.

### Decisions

- **Parity below the search, a rewrite above it.** Board, move generation and evaluation are
  ported bit-for-bit, with the TS code as their oracle: chessops's move order (from-square
  ascending, to-square ascending, promotions Q N R B, castling as king-takes-rook), the same
  xorshift128 stream, every feature bit-identical, the same float summation order in the dot
  product. The search is written from scratch on
  [chessprogramming.org](https://www.chessprogramming.org/) principles instead of transcribing
  the TS one, whose quirks are bugs: it scores stalemate like any other position, quiescence
  skips en passant and quiet promotions, `EVASION_BUDGET` patches over a cost rather than a
  termination problem, and `nodeLimit` cuts an iteration off halfway. Games change once, at
  cutover, which pays for one arena run and a check of every animal against its rating slot.
- **The search.** Fail-soft alpha-beta with PVS, iterative deepening to the bot's depth, a
  transposition table used for move ordering only (the TT move first — no cutoffs, so repetition
  cannot make it path-dependent), then MVV-LVA captures, killers and history over staged
  generation. Quiescence searches captures, promotions and en passant, and every evasion in
  check, with delta pruning priced by the bot's own values. Repetition (twofold inside the tree),
  the fifty-move rule, insufficient material and stalemate all score 0; mate stays
  `MATE_SCORE - ply` scaled by `givesMate`. The root stays shuffled — that is the tie-break, not
  a flaw. `nodeLimit` returns the last completed iteration's move. Null move, LMR, futility and
  razoring are **out**: they assume a sane evaluation, and an animal's is not. A Sloth's `huddle`
  score is exactly what null move would mis-prune.
- **Toolchain: clang `--target=wasm32`, freestanding, no libc, no Emscripten.** No JS glue, a
  module in the tens of KB, `WebAssembly.instantiate` straight from the worker. `wasm-opt` comes
  from the `binaryen` npm package. The same sources build natively for tests and benches with
  ASan + UBSan and llvm-cov. Needs clang + lld locally and in CI.
- **Coarse boundary, never per node.** `search({ fen, moves, weights, options, rngState }) →
{ best, score, nodes, rngState }`, `extract({ fen, played }) → Float64Array` for the
  breakdown, `perft` for tests. Weights and the move history go through linear memory; C replays
  the history into its own Zobrist stack; the RNG state round-trips so TS and C never hold two
  diverging streams. UCI parsing, transports and workers stay TS and stay thin.
- **The registry stays the single source.** `cli/featuresHeader.ts` generates
  `engine/include/features.h` (ids, keys) from `features.ts`. A test fails when the committed
  header is stale. A new heuristic is still one registry entry plus one extractor line, now in C.

### Layout

```
engine/
  include/     one public header per unit, features.h generated
  src/core/    bitboard helpers (builtin popcount/ctz), square/piece types, xorshift128
  src/board/   bitboards + mailbox, FEN, Zobrist, make/unmake over a fixed undo stack
  src/movegen/ magic sliders (fancy, tables built at init), leaper/pawn attack tables,
               fully legal generation from checkers + pin masks, staged captures → quiets, perft
  src/eval/    lazy attack-map context, one .c per TS family, terminal score, dot product
  src/search/  negamax, quiescence + delta pruning, ordering + killers, draws, root + policy
  src/api/     wasm exports and the linear-memory arena
  tests/       unit, perft, differential fixtures
  bench/       the bench binary
```

C17, `-O3 -flto`, `-Werror` with clang-tidy in `lint:check` and clang-format in `format:check`,
no `NOLINT` (the no-lint-disable rule carries over), and the 100-line rule per file. **No allocation
after init:** move lists live on the stack, the undo record sits per ply, and the tables are
built once. A mailbox beside the bitboards makes piece-on-square O(1); today `getRole` scans six
sets for it.

### Tests

- **Perft:** the chessprogramming.org suite (start, Kiwipete, positions 3–6) to depth 5
  natively, depth 3 through the wasm build in vitest. Perft-divide against chessops on a corpus
  of ~1 000 positions drawn from arena games.
- **Invariants in debug builds:** incremental Zobrist equals from-scratch; unmake restores a
  `memcmp`-equal position; a colour-flipped position scores the same, which checks the
  side-to-move rule.
- **Differential vs the TS oracle:** every feature, bit-for-bit, on a ~10 000-position corpus. At
  cutover the oracle's outputs are frozen to committed JSON, so the tests outlive the TS code.
- **The search against itself, not against TS:** a mate-in-N suite; alpha-beta equal to plain
  minimax, and PVS equal to alpha-beta, in score and move on a corpus at small depths; iterative
  deepening with the TT equal to a fixed-depth search without it. A draw by each rule scores 0.
- **Golden games** are regenerated once at cutover, and identical from then on.
- **libFuzzer** on the FEN parser and movegen invariants, run by hand rather than in CI.
- **Coverage** ≥ 90% via llvm-cov on `engine/src`, wired into `test:coverage`.

### Benchmarks

- `engine/bench` over a fixed position set prints perft Mnps, ns per eval family and search
  Mnps, plus a **bench signature** (total nodes), as Stockfish does. A speed-only commit leaves
  the signature unchanged; a commit that changes it says so and why.
- `npm run bench` runs TS and wasm side by side until cutover; after it, the regression guards in
  `performance.test.ts` move to wasm budgets.
- Targets, to be confirmed by the first real numbers: perft ≥ 50 Mnps in wasm, and ≥ 10× today's
  depth-3 search pass.

| Commit                                             | Contents                                                                                                 | Green when                                                              |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| ⬜ `engine: add legal move generation and perft`   | Check/pin-mask legal gen in chessops order, perft, legal-only ep in FEN out                              | CPW perft numbers; move lists equal `legalMoves` on the corpus          |
| ⬜ `engine: add draw detection`                    | Repetition stack, fifty-move, insufficient material                                                      | Agrees with `createDrawTest` on the corpus                              |
| ⬜ `engine: add the eval context and material`     | Lazy attack maps, `features.h` codegen, differential harness, first family                               | Material slots bit-identical to the TS extractor                        |
| ⬜ `engine: port the <family> family` × 9          | One commit per family: placement → endgame, then move                                                    | That family's slots bit-identical on the corpus                         |
| ⬜ `engine: add terminal scoring and the dot`      | `terminalScore`, `liveSlots`, dot in slot order                                                          | `evaluatePosition` identical for every roster bot                       |
| ⬜ `engine: add alpha-beta and quiescence`         | PVS, MVV-LVA + killers, qsearch with en passant/promotions/evasions, delta pruning, draws, shuffled root | Mate-in-N suite; equal to minimax and to plain alpha-beta on the corpus |
| ⬜ `engine: add iterative deepening and the tt`    | ID to the bot's depth, TT-move ordering, `nodeLimit` returns the last iteration                          | Same move and score as fixed depth without the TT; fewer nodes          |
| ⬜ `engine: add the bench binary`                  | Positions, Mnps, per-family ns, signature                                                                | `npm run engine:bench` prints a stable signature                        |
| ⬜ `engine: add the wasm api and ts binding`       | `shared/wasm/`: loader for worker and node, typed `search` / `extract`                                   | vitest drives the wasm build; TS vs wasm side by side in bench          |
| ⬜ `engine: route uci search through wasm`         | `createUciEngine` calls wasm; arena workers load it; golden games regenerated                            | Arena re-run; every animal checked against its rating slot              |
| ⬜ `eval: read the breakdown from wasm`            | `FeatureBreakdown` extracts through wasm                                                                 | Breakdown tests unchanged                                               |
| ⬜ `engine: retire the ts search and extractor`    | Freeze oracle outputs to JSON, delete TS search/eval, update ARCHITECTURE                                | Differential tests run against the frozen fixtures; coverage holds      |
| ⬜ `engine: stage generation and history ordering` | Captures before quiets, history heuristic                                                                | Games identical, bench signature drops, Mnps reported in the message    |
| ⬜ `eval: stop scoring castling as a rook capture` | chessops encodes castling king-takes-rook, so `captureValue` pays for it                                 | Castling reads 0; arena re-run                                          |

## Outside v1

- ⬜ Stockfish as a second `UciEngine` implementation — unlocks the dilution ladder
- ⬜ A Polyglot `.bin` book reader behind `probe(fen)`

## The underwater section

A second roster of **strong but exploitable** bots — the opposite feel to the land animals.
Where a land animal is beaten by out-searching it, a sea animal is beaten by out-_planning_ it:
it plays near-Stockfish moves but can't stop leaning on one feature, and that lean is the door.

- ⬜ `base: "stockfish"` — needs the real `UciEngine` above. Single-threaded `stockfish.wasm`
  (~12 MB, lazy-loaded so the land roster never pays for it), `Threads 1` + a fixed node/depth
  budget for arena determinism, pinned build.
- ⬜ A strength cap on the bot definition: `UCI_LimitStrength` + `UCI_Elo` (≈1400–2000 band).
  This is a coherent weakening — SF plays its 2nd/3rd move, never a random blunder — so games
  stay legible. **Not** the paper's random-move dilution, which the underwater section does not use.
- ⬜ Personality via the existing feature registry: bias SF's root-move scores by the animal's
  weights _before_ `pick_best`, with a blend strength λ on the definition. Low λ = a strong bot
  with a tic; high λ = it follows its instinct into a losing plan the player learns to force.
- ⬜ Emoji budget is tight (~12–15 clean: 🐟🐠🐡🦈🦑🦐🦞🦀🐬🐳🐋🦭🪼🐢). No seahorse emoji exists.
- ⬜ Each sea animal is a pair: an SF Elo target (how hard) + a feature it over-weights (how to
  beat it). E.g. Anglerfish — lures central then strikes; Pufferfish — `huddle` until provoked;
  Electric eel — `kingDanger`, only cares about your king.
