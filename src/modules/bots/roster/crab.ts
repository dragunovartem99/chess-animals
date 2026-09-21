import type { Animal } from "./types";

// Takes the biggest thing it can reach, seeing one move: `captureValue` is a move feature and works
// at depth 1 (the Goat and the Lemming read it there) and not deeper. One move in ten is its own,
// so it grabs when it can and defends nothing.
export const CRAB: Animal = {
	emoji: "🦀",
	tint: "#d0533a",
	definition: {
		id: "crab",
		search: { depth: 1 },
		base: "mate",
		stockfish: { nodes: 150, mix: 10 },
		weights: { captureValue: 100 },
	},
};
