import type { Animal } from "./types";

// Digs a den and sits in it: `castled` tucks the king away, and no other animal leads with it;
// `huddle` pulls the army home around it. Where the Sloth's `huddle` at 550 is an obsession that
// gives up material, the Bear's 40 is a preference — strong at home, and heavy to dislodge.
//
// `huddle` 40 was +102 alone at depth 3, the best positional feature on that search; `castled` 40
// on top rated level with the old `centralization` + `castled` Bear, and above `castled` 20.
export const BEAR: Animal = {
	emoji: "🐻",
	tint: "#6e5647",
	definition: {
		id: "bear",
		search: { depth: 3 },
		base: "material",
		weights: { huddle: 40, castled: 40 },
	},
};
