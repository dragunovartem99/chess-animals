import type { Animal } from "./types";

// Maia at its strongest: the move people rated 2500 play most often, every time, never a draw
// from the spread. It beat the sampled 2500 against the Tiger in the spike.
export const WHALE: Animal = {
	emoji: "🐋",
	tint: "#4a6fa5",
	definition: {
		id: "whale",
		search: { depth: 1 },
		maia: { elo: 2500, greedy: true },
		weights: {},
	},
};
