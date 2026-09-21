import type { Animal } from "./types";

// The busy middle (`centerControl` 80; the Lion's is 30).
export const SEAL: Animal = {
	emoji: "🦭",
	tint: "#8a7f8d",
	definition: {
		id: "seal",
		search: { depth: 3, quiescence: true },
		base: "material",
		stockfish: { nodes: 1600, mix: 8 },
		weights: { centerControl: 80 },
	},
};
