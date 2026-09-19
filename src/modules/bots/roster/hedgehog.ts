import type { Animal } from "./types";

// The Monkey plus one instinct: never leave a piece attacked and undefended. `hanging` is a count
// of such pieces on both sides, and no other animal leads with it. At half a pawn apiece the
// instinct shapes the quiet moves without outbidding the material base — the lab had −50 level
// with or above −100 at depth 2, lighter as observation 4 of LAB.md predicts.
export const HEDGEHOG: Animal = {
	emoji: "🦔",
	tint: "#8f6b4c",
	definition: {
		id: "hedgehog",
		search: { depth: 2 },
		base: "material",
		weights: { hanging: -50 },
	},
};
