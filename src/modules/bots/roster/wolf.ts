import type { Animal } from "./types";

// The paper's `swarm`: an all-out attack with no planning, which it nonetheless rates among the
// better simple strategies — from the bloodbaths it creates it even beats strong opponents now
// and then.
//
// `swarm` is the *mean* distance from our pieces to the enemy king, so the weight is negative:
// less distance, more score. It reads in king-moves per piece, and the weight prices one of them
// at nine pawns — walking the whole army a square closer is worth a queen to the Wolf. The piece
// values are the classical ones, and they are what stop it throwing everything away for a square
// of proximity.
export const WOLF: Animal = {
	emoji: "🐺",
	tint: "#0ea5e9",
	definition: {
		id: "wolf",
		search: { depth: 3 },
		temperature: 0,
		weights: {
			swarm: -900,
			givesMate: 1,
			materialPawn: 100,
			materialKnight: 300,
			materialBishop: 300,
			materialRook: 500,
			materialQueen: 900,
		},
	},
};
