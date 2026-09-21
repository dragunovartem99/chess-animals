import type { Animal } from "./types";

// The king goes to safety before anything (`castled` 200; the Bear's is 40): the den, at full
// volume. A quarter of its moves.
export const TURTLE: Animal = {
	emoji: "🐢",
	tint: "#5f9e6e",
	definition: {
		id: "turtle",
		search: { depth: 3, quiescence: true },
		base: "material",
		stockfish: { nodes: 100, mix: 26 },
		weights: { castled: 200 },
	},
};
