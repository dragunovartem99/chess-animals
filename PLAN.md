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

## Talk

An opt-in speech panel on `/play`: the animals talk, and in a bot-vs-bot game both of them do. A
remark is about the move just played — the piece it took, the check it gave — and said plainly,
in the animal's own attitude rather than a catchphrase. Most moves say nothing: a capture speaks
only when an observer, a Stockfish of its own on fixed nodes and never a monster's, sees it win
something, judged in win chance so an even trade stays quiet. The observer loads with the panel,
so a land game without it still never fetches Stockfish.

- Remarks, from the speaker's side: greeting, check, taking a piece, losing one, mate seen, win,
  loss, draw. One voice a move, and a few plies of cooldown after it.
- A hanging piece is remarked on when it is taken, never before: saying so would give it away.
- The observer's answer is tagged by ply and dropped if the game has moved on: a remark never
  lands a move late.
- Lines live in `talk.<id>.<remark>` in both locales, picked from a seeded stream, never the
  same line twice running. Land animals first; monsters and sea creatures when they have a voice.
- A bot-vs-bot game pauses a random while before each move, talk or no talk, so it can be
  followed. The pause is seeded like everything else random.

| Commit                     | Contents                                                                                                                                                                                                                              | Green when                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| ⬜ `talk: voice the lines` | ElevenLabs once via `npm run voice` (billed, cached, not in the build) into `public/voice/<locale>/<id>/<remark>-<n>[-<piece>].mp3`, a `{piece}` line once per piece; a second toggle, one clip at a time, cut off rather than queued | Silent until the toggle is clicked |

## Outside v1

- ⬜ A Polyglot `.bin` book reader behind `probe(fen)`

## Monsters

The sixteen Stockfish players — a MultiPV line picked by temperature, see
[ARCHITECTURE.md](./ARCHITECTURE.md#monsters) — on `/monsters`. What is left:

- ⬜ Credit Stockfish on the About page and link its source: it is GPL-3.0 and the site is MIT, so
  the build ships `public/stockfish/COPYING.txt` and the page has to say where the source is.
- ⬜ More monsters, if a real idea turns up — each needs a `temperature` rung.

## The underwater section

Maia-3 ([CSSLab/maia3](https://github.com/CSSLab/maia3)): a transformer that predicts a human's
move at a given rating, run with `onnxruntime-web` as
[maia-platform-frontend](https://github.com/CSSLab/maia-platform-frontend) does — one
Elo-conditioned model, the board as 64×12 tokens (mirrored when Black is to move), 4352 move
logits masked to the legal ones and sampled from the seeded stream. Sixteen animals — every roster
has sixteen — on sixteen Elo rungs, as a monster is a temperature rung, tight at the bottom where
the strength moves fastest: 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1650,
1800, 2000, 2200, and at the top 2500 played by its likeliest move rather than sampled, which beat
the sampled 2500 against the Tiger. The twelve old sea creatures come back, with 🦭 🦦 🐢 🐳. The arena
decides whether neighbours stay apart; any two that tie get spread.

What the spike found, 6 games a pair:

- The model is `public/maia3/maia3_simplified.onnx` in the frontend repo, 45.7 MB; inputs `tokens`,
  `elo_self`, `elo_oppo`, outputs `logits_move`, `logits_value`. Castling is standard UCI, `e1g1`.
- `onnxruntime-node` segfaults on load; `onnxruntime-web` runs under node on its wasm backend, so
  the arena and the browser share one runtime. ~140 ms a move on one thread, ~1 s to load.
- Stronger than the plan guessed: Elo 600 sits near the Wolf, 1100 near the Bear, 2500 takes
  half its games off the Tiger. Rung order holds; the top rungs are close and need the arena.
- A Maia game is ~6 s against the land engine's milliseconds: the arena leans on its cache.

| Commit                  | Contents                                                      | Green when                              |
| ----------------------- | ------------------------------------------------------------- | --------------------------------------- |
| ⬜ `about: credit maia` | AGPL-3.0: its source linked beside `public/maia3/COPYING.txt` | The About page says where the source is |
