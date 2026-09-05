import type { Animal } from "./types";

// One move of lookahead, then it plays every capture chain out to the end before it judges the
// position — `quiescence` on, which no other animal sets. It sees a trade through and nothing
// else: blind past the first quiet move, deadly along a forcing one.
export const CROCODILE: Animal = {
	emoji: "🐊",
	tint: "#4f6b48",
	definition: {
		id: "crocodile",
		search: { depth: 1, quiescence: true },
		temperature: 0,
		base: "material",
		weights: {},
	},
};
