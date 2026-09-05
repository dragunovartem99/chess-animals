import type { Animal } from "./types";

// The Monkey plus one instinct: never leave a piece attacked and undefended. `hanging` is a
// count of such pieces on both sides, so at a pawn apiece the instinct shapes the quiet moves
// without ever outbidding the material base it sits on — greedy, but safe, is what plain
// material at depth 2 is not, and it is enough to beat it.
export const HEDGEHOG: Animal = {
	emoji: "🦔",
	tint: "#8f6b4c",
	definition: {
		id: "hedgehog",
		search: { depth: 2 },
		temperature: 0,
		base: "material",
		weights: { hanging: -100 },
	},
};
