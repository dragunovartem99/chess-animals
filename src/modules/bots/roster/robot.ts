import type { Animal } from "./types";

export const ROBOT: Animal = {
	emoji: "🤖",
	tint: "#8a96a3",
	definition: {
		id: "robot",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 5, temperature: 4 },
		weights: {},
	},
};
