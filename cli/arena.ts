import { writeFileSync } from "node:fs";
import { availableParallelism } from "node:os";

import { ROSTER } from "@/modules/bots/roster";
import { openings } from "@/shared/openings";
import { createGameCache, createGamePool, runGamesCached, runTournament } from "@/shared/scheduler";

import { renderCrossTable, renderRatingTable } from "./render";

// `npm run arena` — rate the whole roster against itself over the paired opening set, print the
// tables, and write the full result to `arena-results.json`. A dev tool: it leans on every core
// (pass `--jobs=` to cap it), prints a line per round, and runs for tens of seconds.
//
// Deterministic: the same `--seed` gives the same games, the same ratings, the same JSON. The
// result cache under `.cache/arena` means adding or retuning one bot only replays that bot.
const numArg = (name: string): number | undefined => {
	const found = process.argv.find((arg) => arg.startsWith(`--${name}=`));
	return found ? Number(found.slice(`--${name}=`.length)) : undefined;
};
const seed = numArg("seed") ?? 1;

// Leave a core free by default so the machine stays usable while the arena runs; `--jobs=` overrides.
const jobs = Math.max(1, numArg("jobs") ?? availableParallelism() - 1);

const write = (line: string) => process.stdout.write(`${line}\n`);

const cache = createGameCache({ dir: ".cache/arena" });

const started = Date.now();
// One pool for the whole run: every pair of a round is played concurrently, so a per-call pool
// would spawn `jobs` workers per pair. This caps the process at `jobs` workers total.
const pool = createGamePool({ concurrency: jobs });
const result = await runTournament({
	bots: ROSTER.map((animal) => ({ id: animal.definition.id, definition: animal.definition })),
	openings: openings.map((opening) => ({ id: opening.id, fen: opening.fen })),
	seed,
	run: (specs) =>
		runGamesCached({ specs, cache, run: (misses) => pool.run(misses) }).then(
			(cached) => cached.reports
		),
	onRound: ({ round, games }) =>
		write(
			`round ${round + 1}: ${games} games  (${Math.round((Date.now() - started) / 1000)}s)`
		),
});
await pool.close();

write(`\n${result.games} games over ${result.rounds} rounds  (seed ${seed})\n`);
write(renderRatingTable(result.rating));
write("");
write(renderCrossTable(result.crossTable));

writeFileSync("arena-results.json", `${JSON.stringify(result, null, 2)}\n`);
write("\nwrote arena-results.json");
