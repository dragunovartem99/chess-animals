import type { Animal } from "./types";

export const PUMPKIN: Animal = {
	emoji: "🎃",
	tint: "#e8811c",
	definition: {
		id: "pumpkin",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 5, temperature: 100 },
		weights: {},
	},
};
