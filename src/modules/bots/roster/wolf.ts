import type { Animal } from "./types";

// The paper's `swarm`: an all-out attack with no planning, which it nonetheless rates among the
// better simple strategies — from the bloodbaths it creates it even beats strong opponents now
// and then.
//
// `swarm` is the *mean* distance from our pieces to the enemy king, so the weight is negative:
// less distance, more score. It reads in king-moves per piece, and the weight prices one of them
// at nine pawns — walking the whole army a square closer is worth a queen to the Wolf. The
// `material` base is what stops it throwing everything away for one square of proximity.
export const WOLF: Animal = {
	emoji: "🐺",
	tint: "#0ea5e9",
	definition: {
		id: "wolf",
		search: { depth: 3 },
		temperature: 0,
		base: "material",
		weights: { swarm: -900 },
	},
};
