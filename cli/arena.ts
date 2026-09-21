import { writeFileSync } from "node:fs";
import { availableParallelism } from "node:os";

import { MONSTERS, ROSTER } from "@/modules/bots/roster";
import { openings } from "@/shared/openings";
import { createGameCache, createGamePool, runGamesCached, runTournament } from "@/shared/scheduler";

import { LAB } from "./lab";
import { renderCrossTable, renderRatingTable } from "./render";

// `npm run arena` — rate the whole roster, land and monsters, against itself, print the rating and cross tables, and
// write the full result to `arena-results.json`. A dev tool: it leans on every core but one and
// runs for a few minutes cold, near-instant off the `.cache/arena` result cache (adding or
// retuning one bot only replays that bot).
//
// `npm run arena -- --lab` also rates the candidate bots staged in `cli/lab.ts` — how a new idea
// gets a number against the roster before it becomes an animal. `--lab-only` rates the
// candidates against each other with the roster left out.
//
// No other flags: the run is tuned for speed by default. It plays a rotating window of the
// opening set per pair-visit, seeds off a sparse comparison graph, and stops as soon as the
// standing order is safe rather than pinning every rating. Deterministic all the same — same
// roster in, same games, same JSON out.
const labOnly = process.argv.includes("--lab-only");
const withLab = labOnly || process.argv.includes("--lab");

const write = (line: string) => process.stdout.write(`${line}\n`);
if (withLab && LAB.length === 0) write("--lab: cli/lab.ts holds no candidates");

const roster = [
	...(labOnly ? [] : [...ROSTER, ...MONSTERS].map((animal) => animal.definition)),
	...(withLab ? LAB : []),
];

// Leave a core free so the machine stays usable while the arena runs.
const jobs = Math.max(1, availableParallelism() - 1);
const cache = createGameCache({ dir: ".cache/arena" });

const started = Date.now();
const elapsed = () => Math.round((Date.now() - started) / 1000);

// Rewrite one status line between the per-round prints, throttled — the seeding round alone is
// hundreds of games and its depth-3 pairs are slow, so without this the first minutes are silent.
let lastTick = 0;
const tick = (games: number) => {
	if (Date.now() - lastTick < 1000) return;
	lastTick = Date.now();
	process.stdout.write(`\r  ${games} games  ${elapsed()}s\u001B[K`);
};

// One pool for the whole run: every pair of a round is played concurrently, so a per-call pool
// would spawn `jobs` workers per pair. This caps the process at `jobs` workers total.
const pool = createGamePool({ concurrency: jobs });
const result = await runTournament({
	bots: roster.map((definition) => ({ id: definition.id, definition })),
	openings: openings.map((opening) => ({ id: opening.id, fen: opening.fen })),
	run: (specs) =>
		runGamesCached({ specs, cache, run: (misses) => pool.run(misses) }).then(
			(cached) => cached.reports
		),
	onProgress: tick,
	onRound: ({ round, games }) =>
		write(`\rround ${round + 1}: ${games} games  (${elapsed()}s)\u001B[K`),
});
await pool.close();

write(`\n${result.games} games over ${result.rounds} rounds\n`);
write(renderRatingTable(result.rating));
write("");
write(renderCrossTable(result.crossTable));

writeFileSync("arena-results.json", `${JSON.stringify(result, null, 2)}\n`);
write("\nwrote arena-results.json");
