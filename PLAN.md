# PLAN.md

What lands next. Why the project is shaped this way is in [METHOD.md](./METHOD.md), how it is
built in [ARCHITECTURE.md](./ARCHITECTURE.md), the conventions in [CLAUDE.md](./CLAUDE.md).

One commit at a time, each does one thing, and **every commit leaves the repo green** — format,
types, lint, tests, build.

| Commit                          | Contents                                                                                    | Green when                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| ⬜ `bots: place the Tiger`      | `npm run arena -- --lab`-style full-roster run, reorder `ROSTER`, drop the provisional note | The Tiger sits at its measured rank                 |
| ⬜ `test: golden games`         | Fixed pair + seed + opening → committed PGN fixtures                                        | Any eval change surfaces as a diff                  |
| ⬜ `tablebase: probe interface` | `probe(fen) → { wdl, dtz, moves }` stub, `bot.useTablebase` honoured as a no-op             | The interface compiles and is tested against a fake |

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
- ⬜ Emoji budget is tight (~12–15 clean: 🐟🐠🐡🦈🦑🦐🦞🦀🐬🐳🐋🦭🪼). No seahorse emoji exists.
  🐢 is free — the land Turtle is now the **Sloth** (🦥, same `huddle` weight).
- ⬜ Each sea animal is a pair: an SF Elo target (how hard) + a feature it over-weights (how to
  beat it). E.g. Anglerfish — lures central then strikes; Pufferfish — `huddle` until provoked;
  Electric eel — `kingAttackers`, only cares about your king.
