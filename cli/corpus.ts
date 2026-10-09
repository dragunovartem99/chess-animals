import { writeFileSync } from "node:fs";

import { attackLines } from "./corpus/attacks";
import { moveLines } from "./corpus/moves";

// Seeded, so a rerun is byte-identical. `features.txt`, `evals.txt` and `draws.txt` aren't
// generated: frozen from the retired TS code, changed only by a commit explaining each line.
const FIXTURES: [string, () => string[]][] = [
	["moves.txt", moveLines],
	["attacks.txt", attackLines],
];

for (const [name, lines] of FIXTURES) {
	const output = new URL(`../engine/tests/fixtures/${name}`, import.meta.url);
	const written = lines();

	writeFileSync(output, `${written.join("\n")}\n`);
	console.log(`${written.length} lines -> ${output.pathname}`);
}
