import type { Animal } from "./types";

export const CLOWN: Animal = {
	emoji: "🤡",
	tint: "#d94f70",
	definition: {
		id: "clown",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 5, temperature: 120 },
		weights: {},
	},
};
