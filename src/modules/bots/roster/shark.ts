import type { Animal } from "./types";

// The Lion's idea alone and heavier (`kingDanger` −100; the Lion's is −40): it goes for your king.
export const SHARK: Animal = {
	emoji: "🦈",
	tint: "#5f7f96",
	definition: {
		id: "shark",
		search: { depth: 3, quiescence: true },
		base: "material",
		stockfish: { nodes: 700, mix: 14 },
		weights: { kingDanger: -100 },
	},
};
