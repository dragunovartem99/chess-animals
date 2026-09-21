import type { Animal } from "./types";

export const SKELETON: Animal = {
	emoji: "💀",
	tint: "#cfcabb",
	definition: {
		id: "skeleton",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 5, temperature: 85 },
		weights: {},
	},
};
