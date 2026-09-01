import { writeFileSync } from "node:fs";

import { ROSTER } from "@/modules/bots/roster";
import { openings } from "@/shared/openings";
import { createGameCache, runGamesCached, runTournament } from "@/shared/scheduler";

import { renderCrossTable, renderRatingTable } from "./render";

// `npm run arena` — rate the whole roster against itself over the paired opening set, print the
// tables, and write the full result to `arena-results.json`. A dev tool: it needs every core and
// runs for tens of seconds, and the app has nothing to do with rating bots.
//
// Deterministic: the same `--seed` gives the same games, the same ratings, the same JSON. The
// result cache under `.cache/arena` means adding or retuning one bot only replays that bot.
const seedArg = process.argv.find((arg) => arg.startsWith("--seed="));
const seed = seedArg ? Number(seedArg.slice("--seed=".length)) : 1;

const write = (line: string) => process.stdout.write(`${line}\n`);

const cache = createGameCache({ dir: ".cache/arena" });

const result = await runTournament({
	bots: ROSTER.map((animal) => ({ id: animal.definition.id, definition: animal.definition })),
	openings: openings.map((opening) => ({ id: opening.id, fen: opening.fen })),
	seed,
	run: (specs) => runGamesCached({ specs, cache }).then((cached) => cached.reports),
});

write(`\n${result.games} games over ${result.rounds} rounds  (seed ${seed})\n`);
write(renderRatingTable(result.rating));
write("");
write(renderCrossTable(result.crossTable));

writeFileSync("arena-results.json", `${JSON.stringify(result, null, 2)}\n`);
write("\nwrote arena-results.json");
