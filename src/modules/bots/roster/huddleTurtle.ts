import type { Animal } from "./types";

// The paper's `huddle`: pull every piece towards its own king and build a wall. It wins almost
// nothing on purpose, but it is remarkably hard for a weak opponent to break, which is what makes
// it a useful floor to measure other animals against.
export const HUDDLE_TURTLE: Animal = {
	emoji: "🐢",
	definition: {
		id: "huddle-turtle",
		search: { depth: 1 },
		temperature: 0,
		weights: {
			middlegame: {
				huddle: -10,
				givesMate: 100000,
				kingAttackers: -30,
				materialPawn: 40,
				materialKnight: 120,
				materialBishop: 120,
				materialRook: 200,
				materialQueen: 360,
			},
			// A turtle with nothing left to hide behind has to come out.
			endgame: { huddle: -2, givesMate: 100000, materialPawn: 100, materialQueen: 900 },
		},
	},
};
