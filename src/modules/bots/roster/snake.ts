import type { Animal } from "./types";

// The paper's `min_oppt_moves`: leave the opponent as few moves as possible. It plays as a
// squeeze — pieces go wherever they cover the most of the other side's board — and it is the one
// simple strategy that stumbles into stalemate as often as into mate.
//
// `opponentMobility` counts squares the other side can reach, so one taken away is worth about a
// pawn here. The paper's version has no material sense at all; a little keeps the coils from
// being wound out of pieces it no longer has.
export const SNAKE: Animal = {
	emoji: "🐍",
	tint: "#a3e635",
	definition: {
		id: "snake",
		search: { depth: 2 },
		temperature: 0,
		weights: {
			middlegame: {
				opponentMobility: -25,
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
