# PLAN.md

What lands next. Why the project is shaped this way is in [METHOD.md](./METHOD.md), how it is
built in [ARCHITECTURE.md](./ARCHITECTURE.md), the conventions in [CLAUDE.md](./CLAUDE.md).

One commit at a time, each does one thing, and **every commit leaves the repo green** — format,
types, lint, tests, build.

| Commit                          | Contents                                                                        | Green when                                          |
| ------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------- |
| ⬜ `test: golden games`         | Fixed pair + seed + opening → committed PGN fixtures                            | Any eval change surfaces as a diff                  |
| ⬜ `tablebase: probe interface` | `probe(fen) → { wdl, dtz, moves }` stub, `bot.useTablebase` honoured as a no-op | The interface compiles and is tested against a fake |

## Outside v1

- ⬜ A Polyglot `.bin` book reader

## Monsters

The sixteen Stockfish players — a MultiPV line picked by temperature, see
[ARCHITECTURE.md](./ARCHITECTURE.md#monsters) — on `/monsters`. What is left:

- ⬜ More monsters, if a real idea turns up — each needs a `temperature` rung.
