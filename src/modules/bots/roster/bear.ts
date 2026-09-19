import type { Animal } from "./types";

// Claims the middle and sits behind a castled king: `centralization` drags every piece off the
// rim, and no other animal reads it; `castled` is the small partner that tucks the king away first.
//
// It used to carry `space` as well, but `centralization` and `space` measure nearly the same thing
// — the lab had the pair below `centralization` alone — and `space` is now the Tiger's. Dropping it
// was worth ~+80, and `castled` 20 beat 40.
export const BEAR: Animal = {
	emoji: "🐻",
	tint: "#6e5647",
	definition: {
		id: "bear",
		search: { depth: 3 },
		base: "material",
		weights: { centralization: 8, castled: 20 },
	},
};
