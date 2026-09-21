import type { Animal } from "./types";

export const GHOST: Animal = {
	emoji: "👻",
	tint: "#b8c2d6",
	definition: {
		id: "ghost",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 5, temperature: 30 },
		weights: {},
	},
};
