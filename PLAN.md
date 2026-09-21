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

The sixteen sea animals exist and the arena rates them with the land roster — Stockfish diluted with
the animal's own d3 + q search, see
[ARCHITECTURE.md](./ARCHITECTURE.md#sea-animals). What is left:

- ⬜ Credit Stockfish on the About page and link its source: it is GPL-3.0 and the site is MIT, so
  the build ships `public/stockfish/COPYING.txt` and the page has to say where the source is.
- ⬜ Tune `nodes` and `mix` per animal. The first arena with the bright weights rates them Herring
  1660 up to Goldfish 2284, with Tiger between Jellyfish and Lion. The weights are deliberately
  above `LAB.md`'s d3 + q optima (observation 4 says that costs Elo) so each habit shows; `mix`
  runs from 30 percent to none and `nodes` from 60 to 3000, and both are still first guesses.
- ⬜ More animals, if a real idea turns up. The emoji left are 🐳 (no seahorse, no orca), and each
  animal needs a habit and a `nodes`/`mix` pair.
