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

What is left of the move to C. How it is built is in
[ARCHITECTURE.md](./ARCHITECTURE.md#the-engine); what it replaced is in the history.

| Commit                                             | Contents                                                                 | Green when                     |
| -------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------ |
| ⬜ `eval: stop scoring castling as a rook capture` | chessops encodes castling king-takes-rook, so `captureValue` pays for it | Castling reads 0; arena re-run |

## Outside v1

- ⬜ A Polyglot `.bin` book reader behind `probe(fen)`

## The underwater section

The twelve sea animals exist and the arena rates them with the land roster — Stockfish alone, a
MultiPV line picked by temperature, see [ARCHITECTURE.md](./ARCHITECTURE.md#sea-animals). What is
left:

- ⬜ Credit Stockfish on the About page and link its source: it is GPL-3.0 and the site is MIT, so
  the build ships `public/stockfish/COPYING.txt` and the page has to say where the source is.
- ⬜ More animals, if a real idea turns up. The emoji left are 🐳 (no seahorse, no orca), and each
  animal needs a `temperature` rung.

## Human-like players

- ⬜ Maia-3 ([CSSLab/maia3](https://github.com/CSSLab/maia3)) as a section of its own: a
  transformer that predicts a human's move at a given rating, run in the browser with
  `onnxruntime-web` as [maia-platform-frontend](https://github.com/CSSLab/maia-platform-frontend)
  does — one Elo-conditioned model, the board as 64×12 tokens, the policy sampled from the seeded
  stream. AGPL-3.0, a ~44 MB model plus ~10 MB of runtime fetched on first play; no search, so it
  rates below the Tiger. Spike first: its strength against the roster, under `onnxruntime-node`.
