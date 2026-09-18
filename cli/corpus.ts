import { writeFileSync } from "node:fs";

import { attackLines } from "./corpus/attacks";
import { drawLines } from "./corpus/draws";
import { moveLines } from "./corpus/moves";

// Writes the fixtures the C engine is checked against chessops on. `npm run engine:corpus`
// rewrites them; each is seeded, so a rerun is byte-identical.
//
// `features.txt` and `evals.txt` are not here: they were the TS extractor's and search's answers,
// frozen when the TS code was retired, and are now the record of what the engine reads — edited
// by hand, or by a commit that says why every changed line changed.
const FIXTURES: [string, () => string[]][] = [
	["moves.txt", moveLines],
	["attacks.txt", attackLines],
	["draws.txt", drawLines],
];

for (const [name, lines] of FIXTURES) {
	const output = new URL(`../engine/tests/fixtures/${name}`, import.meta.url);
	const written = lines();

	writeFileSync(output, `${written.join("\n")}\n`);
	console.log(`${written.length} lines -> ${output.pathname}`);
}
