import type { Animal } from "./types";

// The Monkey plus one instinct: give every piece as many squares as it can have. `mobility` is
// our reachable squares minus theirs — pawns and the king aside — so a positive weight pays the
// Spider to develop onto open lines, keep its pieces untangled and deny the same to the
// opponent, all without ever declining a real capture the material base wants.
//
// On `material` at 10 a square of activity is worth a tenth of a pawn: the arena rated the whole
// 6–15 range flat, so 10 is the round middle of a plateau, not a peak. The Tiger carries the same
// weight on a deeper search.
//
// Depth 1: a greedy one-move look, the only material animal that never sees a reply. At depth 2 it
// sat in a knot with the Hedgehog that no weight untied; a ply down it fills the hole between the
// Goat and the Parrot instead — the one-idea animals' floor.
export const SPIDER: Animal = {
	emoji: "🕷️",
	tint: "#5f5a54",
	definition: {
		id: "spider",
		search: { depth: 1 },
		base: "material",
		weights: { mobility: 10 },
	},
};
