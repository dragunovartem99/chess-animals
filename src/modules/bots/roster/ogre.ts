import type { Animal } from "./types";

export const OGRE: Animal = {
	emoji: "👹",
	tint: "#8a9a3b",
	definition: {
		id: "ogre",
		search: { depth: 1 },
		stockfish: { nodes: 5000, lines: 5, temperature: 40 },
		weights: {},
	},
};
