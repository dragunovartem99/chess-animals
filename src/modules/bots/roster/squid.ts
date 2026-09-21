import type { Animal } from "./types";

export const SQUID: Animal = {
	emoji: "🦑",
	tint: "#5b6fd0",
	definition: {
		id: "squid",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 5, temperature: 52 },
		weights: {},
	},
};
