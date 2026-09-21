import type { Animal } from "./types";

// Diluted with random moves, the paper's own dilution, not with an idea: the school scatters, and
// on one move in ten the herring goes wherever the current takes it. No base and no weights, so
// its own search is the Donkey's — a uniform pick of the legal moves. Stockfish plays the rest.
export const HERRING: Animal = {
	emoji: "🐟",
	tint: "#8fb8cf",
	definition: {
		id: "herring",
		search: { depth: 1 },
		stockfish: { nodes: 300, mix: 10 },
		weights: {},
	},
};
