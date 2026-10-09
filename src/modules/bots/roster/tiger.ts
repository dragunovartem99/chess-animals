import type { Animal } from "./types";

// Quiescence is what stops the `swarm` charge being suicide; at a thirtieth of the Wolf's weight
// and braced by `mobility`, it presses without throwing the army away.
export const TIGER: Animal = {
	emoji: "🐅",
	tint: "#db7f2b",
	definition: {
		id: "tiger",
		search: { depth: 3, quiescence: true },
		base: "material",
		weights: { swarm: 20, mobility: 10 },
	},
};
