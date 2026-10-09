import type { Animal } from "./types";

// `swarm` at 600 outbids a minor piece, so it throws pieces at the king. 400 sat level with bare
// material; 700 crowds the Sloth.
export const WOLF: Animal = {
	emoji: "🐺",
	tint: "#6b7885",
	definition: {
		id: "wolf",
		search: { depth: 2 },
		base: "material",
		weights: { swarm: 600 },
	},
};
