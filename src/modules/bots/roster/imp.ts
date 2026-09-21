import type { Animal } from "./types";

export const IMP: Animal = {
	emoji: "😈",
	tint: "#a3368f",
	definition: {
		id: "imp",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 5, temperature: 20 },
		weights: {},
	},
};
