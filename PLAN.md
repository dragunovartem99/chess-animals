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

- ⬜ Keep ElevenLabs' original responses in git (`voice-raw/<locale>/<id>/<remark>-<n>.mp3`, outside `public/`), have `npm run voice` level from them and a `voice:level` rebuild `public/voice/` without the API — needs one full re-record, since no clip has its original yet

- ⬜ A Polyglot `.bin` book reader
