import type { Animal } from "./types";

// `opponentMobility` closes your exits, and `hanging` -50 is what lifts it: taking squares away
// only pays when the pieces doing it are safe.
export const FOX: Animal = {
	emoji: "🦊",
	tint: "#c2632e",
	definition: {
		id: "fox",
		search: { depth: 2 },
		base: "material",
		weights: { opponentMobility: -8, hanging: -50 },
	},
};
