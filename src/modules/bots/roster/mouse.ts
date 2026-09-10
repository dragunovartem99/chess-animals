import type { Animal } from "./types";

// Keeps its knights and bishops at home and flinches from every capture — the Dove's refusal to
// fight, without the Dove's dread of checks, on top of never getting its pieces out.
//
// The temperature is the calibration, not a repetition-breaker: at 100 centipawns a pawn grab
// costs it half a pawn of willingness, a knight three halves, so it mostly shuffles at random and
// only sometimes takes what is offered. The lab put that at 345, midway between the Dove (244) and
// the Lemming (514); at 50 it sat on the Dove and at 200 on the Lemming.
//
// No base, and no `givesMate`: it cannot see a mate either way.
export const MOUSE: Animal = {
	emoji: "🐁",
	tint: "#9e9aa6",
	definition: {
		id: "mouse",
		search: { depth: 1 },
		temperature: 100,
		weights: { development: -60, captureValue: -50 },
	},
};
