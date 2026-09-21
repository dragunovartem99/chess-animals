import type { Animal } from "./types";

export const ALIEN: Animal = {
	emoji: "👽",
	tint: "#7ac74f",
	definition: {
		id: "alien",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 5, temperature: 52 },
		weights: {},
	},
};
