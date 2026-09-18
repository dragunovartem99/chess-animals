import { writeFileSync } from "node:fs";

import { attackLines } from "./corpus/attacks";
import { drawLines } from "./corpus/draws";
import { moveLines } from "./corpus/moves";

// Writes the fixtures the C engine is checked against chessops on. `npm run engine:corpus`
// rewrites them; each is seeded, so a rerun is byte-identical.
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
