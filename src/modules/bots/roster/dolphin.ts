import type { Animal } from "./types";

export const DOLPHIN: Animal = {
	emoji: "🐬",
	tint: "#3f8fbf",
	definition: {
		id: "dolphin",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 5, temperature: 13 },
		weights: {},
	},
};
