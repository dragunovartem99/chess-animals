import type { Animal } from "./types";

export const SHARK: Animal = {
	emoji: "🦈",
	tint: "#5f7f96",
	definition: {
		id: "shark",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 5, temperature: 25 },
		weights: {},
	},
};
