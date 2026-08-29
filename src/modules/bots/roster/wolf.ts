import type { Animal } from "./types";

// The paper's `swarm`: an all-out attack with no planning, which it nonetheless rates among the
// better simple strategies — from the bloodbaths it creates it even beats strong opponents now
// and then.
//
// `swarm` is the *mean* distance from our pieces to the enemy king, so the weight is negative:
// less distance, more score. It reads in king-moves per piece, which is why the weight is around
// fifteen times a material weight — one king-move closer with the whole army is a lot. A little
// material keeps it from throwing everything away for one square of proximity.
export const WOLF: Animal = {
	emoji: "🐺",
	definition: {
		id: "wolf",
		search: { depth: 1 },
		temperature: 0,
		weights: {
			middlegame: {
				swarm: -180,
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
