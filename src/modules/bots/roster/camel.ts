import type { Animal } from "./types";

// The endgame animal: walks its king into the middle and runs its passed pawns, both scaled to
// nothing while the pieces are on and to full strength once they are off (see
// `families/endgame.ts`). Every other animal plays the ending with the same eye it played the
// opening with.
//
// Depth 2 with quiescence — the only animal on that search. It is what an ending needs, since a
// pawn race is all captures and promotions past the leaf, and it slots the Camel between the Hare
// and the Raven. The lab put it +106 over the same search with bare material.
export const CAMEL: Animal = {
	emoji: "🐪",
	tint: "#a38a63",
	definition: {
		id: "camel",
		search: { depth: 2, quiescence: true },
		base: "material",
		weights: { passedPawnPush: 12, kingActivity: 20 },
	},
};
