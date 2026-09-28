import type { Animal } from "./types";

export const ROBOT: Animal = {
	emoji: "🤖",
	tint: "#8a96a3",
	definition: {
		id: "robot",
		search: { depth: 1 },
		stockfish: { nodes: 1600, lines: 1, temperature: 0 },
		weights: {},
	},
};
