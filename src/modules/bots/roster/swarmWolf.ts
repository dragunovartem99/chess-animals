import type { Animal } from "./types";

// The paper's `swarm`: an all-out attack with no planning, which it nonetheless rates among the
// better simple strategies — from the bloodbaths it creates it even beats strong opponents now
// and then.
//
// `swarm` is the summed distance from our pieces to the enemy king, so the weight is negative:
// less distance, more score. A little material keeps it from throwing everything away for one
// square of proximity.
export const SWARM_WOLF: Animal = {
	emoji: "🐺",
	definition: {
		id: "swarm-wolf",
		search: { depth: 1 },
		temperature: 0,
		weights: {
			middlegame: {
				swarm: -12,
				givesMate: 100000,
				materialPawn: 20,
				materialKnight: 60,
				materialBishop: 60,
				materialRook: 100,
				materialQueen: 180,
			},
		},
	},
};
