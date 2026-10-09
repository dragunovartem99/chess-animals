import type { Animal } from "./types";

// The paper's `cccp`: checkmate, check, capture, push, ordered by weight size. On `mate`, not
// `material`, so it never notices what it loses.
export const GOAT: Animal = {
	emoji: "🐐",
	tint: "#9a7b3c",
	definition: {
		id: "goat",
		// Depth 1: the strategy is a priority over the moves in front of it, not a plan.
		search: { depth: 1 },
		// No material base: it never once notices what it is losing.
		base: "mate",
		weights: {
			givesCheck: 1000,
			captureValue: 100,
			pushDepth: 10,
		},
	},
};
