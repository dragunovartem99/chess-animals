import type { Animal } from "./types";

// The paper's `huddle`: pull every piece towards its own king and build a wall. It wins almost
// nothing on purpose, but it is remarkably hard for a weak opponent to break, which is what makes
// it a useful floor to measure other animals against.
//
// It deliberately carries no `kingAttackers` weight. That feature is a difference — attackers on
// our king minus attackers on theirs — so a negative weight buys king safety *and* an appetite
// for attacking the enemy king, which it cannot buy separately. A turtle given one marched its
// knight out to d4 on move two to hit the squares beside White's king, which is the opposite of
// its whole character.
export const HUDDLE_TURTLE: Animal = {
	emoji: "🐢",
	definition: {
		id: "huddle-turtle",
		search: { depth: 1 },
		temperature: 0,
		weights: {
			middlegame: {
				huddle: -150,
				givesMate: 100000,
				materialPawn: 40,
				materialKnight: 120,
				materialBishop: 120,
				materialRook: 200,
				materialQueen: 360,
			},
			// A turtle with nothing left to hide behind has to come out.
			endgame: { huddle: -30, givesMate: 100000, materialPawn: 100, materialQueen: 900 },
		},
	},
};
