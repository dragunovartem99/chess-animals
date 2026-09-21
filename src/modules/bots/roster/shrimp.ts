import type { Animal } from "./types";

// The whole swarm goes at your king at once (`swarm` 200; the Tiger's is 20, the Wolf's 600).
export const SHRIMP: Animal = {
	emoji: "🦐",
	tint: "#e07a5f",
	definition: {
		id: "shrimp",
		search: { depth: 3, quiescence: true },
		base: "material",
		stockfish: { nodes: 200, mix: 22 },
		weights: { swarm: 200 },
	},
};
