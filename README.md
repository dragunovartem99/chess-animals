# chess-animals

<img src="public/og.png" alt="chess-animals preview card: the roster, weakest first">
<img src="public/og-underwater.png" alt="chess-animals preview card: the underwater roster, weakest first">
<img src="public/og-monsters.png" alt="chess-animals preview card: the monsters, weakest first">

Every animal plays chess its own strange way. Can you beat one?

Three rosters of sixteen, each on its own engine:

- **Land animals** run on one small C engine compiled to wasm. A personality is nothing but a set
  of tunable heuristic weights, and a move is a dot product between those weights and one feature
  vector describing the position — the random 🐴 Donkey is all zeros, the check-happy 🐐 Goat
  weighs checks over captures.
- **Underwater animals** are [Maia](https://maiachess.com/), a network trained to play like
  people, each asked for a different rating — the 🦐 Shrimp at 500 up to the 🐋 Whale at 2500.
- **Monsters** are Stockfish, softened: each weighs its top lines and sometimes plays a worse one,
  more often the hotter it runs — up to the 🐉 Dragon, which never slips.

Live at [chess-animals.com](https://chess-animals.com/),
in English and Russian.

The design comes from Tom 7's [_Elo World_](paper.pdf) (SIGBOVIK 2019), which rates a crowd of
deliberately weak or quirky players against each other to stretch the chess rating scale all the
way down — see [METHOD.md](./METHOD.md).

## Development

Requires Node.js ≥ 24, and clang 22 with lld, clang-tidy, clang-format and llvm for the C
engine under `engine/`.

```sh
npm install
npm run dev
```

| Command                             | What it does                                                            |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `npm run dev` / `build` / `preview` | Vite dev server / type-checked production build / preview of it         |
| `npm test` / `test:coverage`        | C tests under ASan + UBSan, then Vitest / both with 90% coverage        |
| `npm run bench`                     | search cost through wasm, held under a guard by the suite               |
| `npm run engine:bench`              | the C engine natively: perft, each feature's cost, the search signature |
| `npm run arena`                     | dev CLI: rate the roster over the paired opening set                    |
| `npm run tune -- <botId>`           | dev CLI: SPSA-tune one bot's weights against the roster                 |
| `npm run voice`                     | dev CLI: record the animals' missing voice clips with ElevenLabs        |
| `npm run og`                        | draw the preview cards (the build does it too)                          |
| `npm run lint` / `format`           | oxlint + clang-tidy / oxfmt + clang-format (`:check` don't write)       |
| `npm run types:check`               | `vue-tsc` type-check                                                    |
| `npm run engine:corpus`             | regenerate the C engine's chessops fixture corpus                       |
| `npm run engine:features`           | regenerate the C engine's feature-id header from the registry           |

Linting and formatting via [oxlint](https://oxc.rs)/[oxfmt](https://oxc.rs), type-checking via
`vue-tsc`, tests via Vitest. CI runs all of them plus the build on every pull request;
`main` runs them again and, once green, deploys to [chess-animals.com](https://chess-animals.com/).

## Documentation

| File                                 | Covers                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------ |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | how the app is built — layout, modules, the eval, the engine, deployment |
| [METHOD.md](./METHOD.md)             | what it measures — the paper, the feature vector, rating, tuning         |
| [LAB.md](./LAB.md)                   | what the weight bench measured — findings, singles, the land roster      |
| [CLAUDE.md](./CLAUDE.md)             | code conventions this repo holds itself to                               |
| [PLAN.md](./PLAN.md)                 | what lands next                                                          |

## Where it stands

All 48 are rated together by the arena, in points pinned to Maia's human-like ratings: from the
Dove (−560) to the Dragon (2450). The land roster tops out at the Tiger (1680), just past where
the monsters begin. Built: the feature evaluation and a PVS search with quiescence in C, Maia and
Stockfish in the browser, `/play` with a move list to step through and copy as PGN and a speech
panel where the animals talk, voiced in both languages, `/about`, and the dev CLIs
`npm run arena` and `npm run tune`.

Next, per [PLAN.md](./PLAN.md): golden-game fixtures and a tablebase probe interface.

## Credit

[_Elo World, a framework for benchmarking weak chess engines_](paper.pdf), Dr. Tom Murphy VII
Ph.D., SIGBOVIK 2019. Board by [chessground](https://github.com/lichess-org/chessground), rules by
[chessops](https://github.com/niklasf/chessops), both from lichess. Underwater animals by [Maia](https://maiachess.com/), monsters by
[Stockfish](https://stockfishchess.org/).
