import type { Animal } from "./types";

// The paper's `cccp`: Checkmate, Check, Capture, Push, in that order, and nothing else. The
// paper rates it the best of its simple strategies; here it comes last of the animals that have
// an idea, because the ones it is up against read a whole position and it reads one move.
//
// The order is the weights: a check outbids the biggest capture (`captureValue` is priced in
// pawns, so a queen reads nine), and a push breaks the ties left over. It is written on `mate`
// rather than `material` deliberately — it never once notices what it is losing, which is what
// keeps it above the Donkey and below everything else.
export const SHARK: Animal = {
	emoji: "🦈",
	tint: "#64748b",
	definition: {
		id: "shark",
		// Depth 1: the strategy is a priority over the moves in front of it, not a plan.
		search: { depth: 1 },
		temperature: 0,
		// No material base: it never once notices what it is losing.
		base: "mate",
		weights: {
			givesCheck: 1000,
			captureValue: 100,
			pushDepth: 10,
		},
	},
};
