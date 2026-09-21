import type { Animal } from "./types";

// A goldfish, and no dilution: every move is Stockfish's, on the biggest budget of the sixteen. It
// has no habit, so nothing in `weights`. The ceiling the others are measured against, and the only
// sea animal you cannot outplan.
export const GOLDFISH: Animal = {
	emoji: "🐠",
	tint: "#e0a030",
	definition: {
		id: "goldfish",
		search: { depth: 3, quiescence: true },
		base: "material",
		stockfish: { nodes: 3000, mix: 0 },
		weights: {},
	},
};
