import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { parse } from "yaml";

export type Cast = {
	voice: string;
	gender: "male" | "female" | "genderless";
	age: string;
	persona: string;
	emotion: string;
	delivery: string;
	character: string;
	speaks: "he" | "she" | "we";
};

const FILE = path.join(import.meta.dirname, "cast.yaml");

export const CAST: Record<string, Cast> = parse(readFileSync(FILE, "utf8"));

// Swaps a voice id in the file as text rather than through a parse and dump, which would drop the
// comments and reflow the layout. The whole line goes, so a stale "# stock X" note goes with it.
export function recast({ from, to }: { from: string; to: string }) {
	const text = readFileSync(FILE, "utf8");
	const line = new RegExp(`voice: ${from}.*`, "u");
	if (!line.test(text)) throw new Error(`no voice ${from} in cli/voice/cast.yaml`);
	writeFileSync(FILE, text.replace(line, `voice: ${to}`));
}
