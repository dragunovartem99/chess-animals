import type { Animal } from "./types";

// The paper's `huddle`: keep every piece as close to your own king as you can. It is the mirror
// of the Wolf's `swarm` and rates just under it — a shell wins nothing by itself, but the pieces
// inside one are never hanging either.
//
// `huddle` is the *mean* distance from our pieces to our own king, so the weight is negative in
// the same way as the Wolf's, and a little smaller: a shell is worth having but not worth a
// queen. The material terms are what stop it being built out of pieces given away to build it.
export const TURTLE: Animal = {
	emoji: "🐢",
	tint: "#10b981",
	definition: {
		id: "turtle",
		search: { depth: 2 },
		temperature: 0,
		weights: {
			huddle: -750,
			givesMate: 1,
			materialPawn: 100,
			materialKnight: 300,
			materialBishop: 300,
			materialRook: 500,
			materialQueen: 900,
		},
	},
};
