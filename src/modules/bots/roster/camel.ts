import type { Animal } from "./types";

// The endgame animal: walks its king into the middle and runs its passed pawns, both scaled to
// nothing while the pieces are on and to full strength once they are off (see
// `engine/src/eval/endgame.c`). The king's scale is squared, so a queen trade alone doesn't send it
// walking into a board still full of rooks. Every other animal plays the ending with the same eye
// it played the opening with.
//
// `development` is what it does until then: both endgame features are silent in the opening, and
// without a middlegame weight the Camel played that phase as bare material. The lab put it +75
// over the endgame pair alone, more than `castled`, `pushDepth` or `centerControl` did.
//
// Depth 2 with quiescence — the only animal on that search. It is what an ending needs, since a
// pawn race is all captures and promotions past the leaf, and it slots the Camel between the Hare
// and the Raven.
export const CAMEL: Animal = {
	emoji: "🐪",
	tint: "#a38a63",
	definition: {
		id: "camel",
		search: { depth: 2, quiescence: true },
		base: "material",
		weights: { passedPawnPush: 24, kingActivity: 20, development: 20 },
	},
};
