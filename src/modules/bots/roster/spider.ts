import type { Animal } from "./types";

// The Monkey plus one instinct: give every piece as many squares as it can have. `mobility` is
// our reachable squares minus theirs — pawns and the king aside — so a positive weight pays the
// Spider to develop onto open lines, keep its pieces untangled and deny the same to the
// opponent, all without ever declining a real capture the material base wants.
//
// On `material` at 10 a square of activity is worth a tenth of a pawn: the arena rates the whole
// 6–15 range flat and above the Hedgehog, so 10 is the round middle of a plateau, not a peak.
// Depth 2, temp 0. No other animal reads mobility.
export const SPIDER: Animal = {
	emoji: "🕷️",
	tint: "#566a6b",
	definition: {
		id: "spider",
		search: { depth: 2 },
		temperature: 0,
		base: "material",
		weights: { mobility: 10 },
	},
};
