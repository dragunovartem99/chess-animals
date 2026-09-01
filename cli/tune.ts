import { writeFileSync } from "node:fs";

import { ROSTER } from "@/modules/bots/roster";
import { openings } from "@/shared/openings";
import { runGames } from "@/shared/scheduler";
import { runTuning } from "@/shared/tuner";

// `npm run tune -- <botId> [--iterations=40] [--seed=1] [--openings=12]` — SPSA one roster bot's
// weights against the rest of the roster over a slice of the paired opening set, printing the
// gauntlet score each iteration and writing `<botId>-tuned.json` if the run improved it.
const write = (line: string) => process.stdout.write(`${line}\n`);
const flag = (name: string, fallback: number) => {
	const found = process.argv.find((arg) => arg.startsWith(`--${name}=`));
	return found ? Number(found.slice(name.length + 3)) : fallback;
};

const botId = process.argv[2];
const animal = ROSTER.find((entry) => entry.definition.id === botId);
if (!animal) {
	const known = ROSTER.map((entry) => entry.definition.id).join(", ");
	throw new Error(`unknown bot "${botId ?? ""}" — one of: ${known}`);
}

const iterations = flag("iterations", 40);
const seed = flag("seed", 1);
const opponents = ROSTER.filter((entry) => entry.definition.id !== botId).map((entry) => ({
	id: entry.definition.id,
	definition: entry.definition,
}));
const gauntletOpenings = openings
	.slice(0, flag("openings", 12))
	.map((opening) => ({ id: opening.id, fen: opening.fen }));

write(`tuning ${botId}: ${iterations} iterations vs ${opponents.map((o) => o.id).join(", ")}`);

const result = await runTuning({
	definition: animal.definition,
	opponents,
	openings: gauntletOpenings,
	iterations,
	seed,
	run: (specs) => runGames({ specs }),
	onStep: ({ iteration, score }) =>
		write(`  ${String(iteration + 1).padStart(3)}/${iterations}   ${score.toFixed(3)}`),
});

const delta = result.final - result.baseline;
write(
	`\nbaseline ${result.baseline.toFixed(3)}  →  final ${result.final.toFixed(3)}   (${delta >= 0 ? "+" : ""}${delta.toFixed(3)})`
);

if (delta <= 0) {
	write("no improvement — original weights kept");
} else {
	writeFileSync(`${botId}-tuned.json`, `${JSON.stringify(result.tuned, null, 2)}\n`);
	write(`wrote ${botId}-tuned.json`);
}
