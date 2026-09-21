import type { Animal } from "./types";

export const CRAB: Animal = {
	emoji: "🦀",
	tint: "#d0533a",
	definition: {
		id: "crab",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 5, temperature: 45 },
		weights: {},
	},
};
