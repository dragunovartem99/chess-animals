import type { Animal } from "./types";

// The Goat's check-first instinct at depth 1, where it works: `givesCheck` reads the move that made
// the position, so at depth 3 it is the third move of a line and changes almost nothing. One move
// in twelve is its own, and it checks if it can.
export const SQUID: Animal = {
	emoji: "🦑",
	tint: "#5b6fd0",
	definition: {
		id: "squid",
		search: { depth: 1 },
		base: "mate",
		stockfish: { nodes: 150, mix: 8 },
		weights: { givesCheck: 1000 },
	},
};
