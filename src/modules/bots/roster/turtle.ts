import type { Animal } from "./types";

// Nothing is left out to be taken (`hanging` −50, the Hedgehog's lead on a Stockfish mix): the
// shell. A quarter of its moves are Stockfish's, which castles on its own, so the Turtle's idea
// is the one thing Stockfish at this depth still forgets.
export const TURTLE: Animal = {
	emoji: "🐢",
	tint: "#5f9e6e",
	definition: {
		id: "turtle",
		search: { depth: 3, quiescence: true },
		base: "material",
		stockfish: { nodes: 100, mix: 26 },
		weights: { hanging: -50 },
	},
};
