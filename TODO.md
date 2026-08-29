# chess-animals — commit ladder

Derived from [PLAN.md](PLAN.md). Checked = committed on `master`.

## Phase A — foundations

- [x] 1. `chore: scaffold vite + vue 3 + ts`
- [x] 2. `docs: add PLAN.md`
- [x] 3. `chore: router + i18n shell`
- [x] 4. `shared/chess: position helpers`
- [x] 5. `shared/engine: seeded rng`

## Phase B — the eval

- [x] 6. `eval: feature registry + vector types`
- [x] 7. `eval: material and mobility features`
- [x] 8. `eval: positional features`
- [x] 9. `eval: pawn structure features`
- [x] 10. `eval: king safety features`
- [x] 11. `eval: behavioural features`
- [x] 12. `eval: move-level features`
- [x] 13. `perf: benchmark feature extraction`

## Phase C — bots that play

- [x] 14. `engine: depth-1 greedy policy`
- [x] 15. `engine: negamax + alpha-beta`
- [x] 16. `bots: config type + roster`
- [x] 17. `engine: UCI codec`
- [x] 18. `engine: worker client`

## Phase D — playing it

- [x] 19. `board: chessground wrapper`
- [x] 20. `game: play view`
- [x] 21. `game: feature breakdown panel`

## Phase E — the arena

- [ ] 22. `openings: paired opening set` — ~50 balanced FENs as JSON behind `probe(fen)`; colour-swapped pairing
- [ ] 23. `rating: bradley-terry MLE` — MM fit, white-advantage, draw parameter, prior anchor, CIs from the Hessian
- [ ] 24. `rating: markov champion` — trophy transition matrix, power iteration
- [ ] 25. `scheduler: worker pool + game runner` — whole games in-worker, pool = `hardwareConcurrency`, ply cap, adjudication
- [ ] 26. `scheduler: result cache` — content-addressed IndexedDB, `hash(white, black, openingId, seed)`
- [ ] 27. `scheduler: adaptive pairing` — pick the pair that most reduces rating uncertainty; 12 bots to ±40 Elo in <30 s
- [ ] 28. `arena: tournament view` — `/arena` run control, cross-table heat map, rating table with CIs

## Phase F — tuning

- [ ] 29. `bots: weight editor` — `/bots/:id`, three phase columns, sliders by family, live eval, diff
- [ ] 30. `tuner: SPSA core` — Rademacher perturbation, paired gauntlet with common random numbers, decaying `a`/`c`
- [ ] 31. `tuner: run UI` — `/tuner` live score chart, stop/resume, JSON export

## Phase G — finishing

- [ ] 32. `bots: full animal roster` — ~12 animals, RU/EN names and descriptions
- [ ] 33. `test: golden games` — fixed pair + seed + opening → committed PGN fixtures
- [ ] 34. `docs: about page + README`
- [ ] 35. `tablebase: probe interface` — `probe(fen) → { wdl, dtz, moves }` stub, `bot.useTablebase` as no-op

## Outside v1

- [ ] 36. Stockfish as a second `UciEngine` implementation (unlocks the dilution ladder)
- [ ] 37. Polyglot `.bin` book reader behind `probe(fen)`

## Extra commits, not in the plan

- [x] `perf: speed up feature extraction` — 77 µs → ~18 µs against a 60 µs guard (5 µs proved unachievable; PLAN.md #13 updated to match)
- [x] `game: explain the move that produced the position`
- [x] `game: report evaluations White-relative, in pawns`
- [x] `eval: measure proximity per piece, not per army`
