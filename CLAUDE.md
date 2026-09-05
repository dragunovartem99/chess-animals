# CLAUDE.md

Conventions this repo holds itself to. How the app is built is in
[ARCHITECTURE.md](./ARCHITECTURE.md), what it measures in [METHOD.md](./METHOD.md), and what lands
next in [PLAN.md](./PLAN.md).

## Code style

- DO use `type X = {}` aliases, NOT `interface` (sole exception: global declaration merging, e.g. `env.d.ts`)
- DO take a single object parameter instead of 2+ positional arguments
- DO NOT add lint-disable comments — restructure the code until the linter passes
- DO keep a file under 100 lines of real code (`max-lines`, blank lines and comments excluded). A file that outgrows it is usually two things: split by what it does, not by line count
- DO write comments that explain _why_, not _what_ — the tradeoff taken, the alternative rejected, the bug the shape prevents. A comment restating the code is noise

## Structure

- DO keep every `modules/<name>` self-contained: `components/`, `composables/`, `utils/`, and an `index.ts` barrel exporting only the public surface
- DO NOT import a module's internals from outside it — the router included, which reaches a view through the barrel so each module stays its own lazy chunk
- DO NOT import across modules; anything two of them need moves to `shared/<area>/`
- DO put shared code in `shared/<area>/` with its own `index.ts` and NO root barrel — `shared/` depends on nothing else in the repo
- DO import `shared/` from a module through the `@/` alias, and use relative paths within an area
- DO keep the workers thin: a worker owns a pipe and delegates, so the logic is testable without spawning one

## The feature registry

- DO add a heuristic as one entry in `shared/eval/features.ts` plus one line in its family's extractor — the registry is what drives the sliders, the UCI options, the bot schema and the locale files at once
- DO append entries, never reorder or remove them: ids are assigned from registry order, and a bot's saved weights are keyed by `key`
- DO give every feature a label in **both** locales — the coverage spec fails otherwise
- DO evaluate from the side to move's perspective, always. No evaluation code is colour-specific

## Locales

- DO add UI strings to `locales/ru/` and `locales/en/` at once — a missing key is a type error, not a fallback
- DO keep bot names and descriptions under `bot.<id>` and feature labels under `feature.<key>`, so a new animal or heuristic is untranslatable-by-accident rather than silently English-only

## Tests

- DO colocate tests in `__tests__/` next to the code they cover
- DO keep coverage over the 90% threshold on `shared/` and on modules' `utils/`/`composables/` — the rest is excluded from the numbers deliberately, so what is counted is code a test can actually reach
- DO extract pure decision logic out of I/O-heavy code so tests need no mocking
- DO seed anything random and assert the sequence — a flaky engine test is worse than no test

## Commits

- DO leave the repo green at every commit: `format:check`, `types:check`, `lint:check`, `test:coverage`, `build`
- DO make one commit do one thing, so it is reviewable on its own and revertable without unpicking the next
- DO write `<area>: <what>` in the imperative, lower case, one line, e.g. `eval: add pawn structure features`
- DO delete the matching row from [PLAN.md](./PLAN.md) in the same commit that lands it — the file lists only what is still to come
