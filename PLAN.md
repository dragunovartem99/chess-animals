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

## Monsters

The twelve Stockfish players — a MultiPV line picked by temperature, see
[ARCHITECTURE.md](./ARCHITECTURE.md#monsters) — on `/monsters`. What is left:

- ⬜ Credit Stockfish on the About page and link its source: it is GPL-3.0 and the site is MIT, so
  the build ships `public/stockfish/COPYING.txt` and the page has to say where the source is.
- ⬜ More monsters, if a real idea turns up — each needs a `temperature` rung.

## The underwater section

Maia-3 ([CSSLab/maia3](https://github.com/CSSLab/maia3)): a transformer that predicts a human's
move at a given rating, run in the browser with `onnxruntime-web` as
[maia-platform-frontend](https://github.com/CSSLab/maia-platform-frontend) does — one
Elo-conditioned model, the board as 64×12 tokens, the policy sampled from the seeded stream. An
animal is an Elo rung, as a monster is a temperature rung. AGPL-3.0, a ~44 MB model plus ~10 MB of
runtime fetched on first play, behind the board's loading state; no search, so it rates below the
Tiger.

| Commit                           | Contents                                                                          | Green when                                 |
| -------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------ |
| ⬜ spike, not committed          | The model under `onnxruntime-node` against the roster, a handful of rungs, ~1 min | Where each Elo lands is known              |
| ⬜ `underwater: maia mover`      | Board tokens, legal-move mask, seeded sampling; tested against a fake session     | A fake policy picks the move it should     |
| ⬜ `arena: rate underwater`      | The rungs in the rating table; the cache keys on the model's hash                 | The table rates them beside the roster     |
| ⬜ `underwater: play in browser` | `onnxruntime-web` in the worker, the model fetched on first play only             | A game against a rung plays in the browser |
| ⬜ `underwater: maia animals`    | Sea creatures on Elo rungs, copy in both locales, the `/underwater` tab back      | The tab lists them and they play           |
| ⬜ `about: credit maia`          | AGPL-3.0: its source linked, its licence shipped                                  | The About page says where the source is    |
