import type { Animal } from "./types";

export const OCTOPUS: Animal = {
	emoji: "🐙",
	tint: "#a4508b",
	definition: {
		id: "octopus",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 5, temperature: 4 },
		weights: {},
	},
};
