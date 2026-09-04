import type { Animal } from "./types";

// The paper's `huddle`: keep every piece as close to your own king as you can. It is the mirror
// of the Wolf's `swarm` and rates just under it — a shell wins nothing by itself, but the pieces
// inside one are never hanging either.
//
// `huddle` is the *mean* distance from our pieces to our own king, so the weight is negative in
// the same way and on the same scale as the Wolf's. The material terms are what stop the shell
// from being built out of pieces given away to build it.
export const TURTLE: Animal = {
	emoji: "🐢",
	tint: "#10b981",
	definition: {
		id: "turtle",
		search: { depth: 2 },
		temperature: 0,
		weights: {
			middlegame: {
				huddle: -150,
				givesMate: 1,
				materialPawn: 20,
				materialKnight: 60,
				materialBishop: 60,
				materialRook: 100,
				materialQueen: 180,
			},
		},
	},
};
