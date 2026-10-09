import type { Animal } from "./types";

// The paper's `pacifist`: the Goat's weights negated. No base, so quiet moves score zero and it
// shuffles at random. `givesMate: -1` is required: mate is scored only for a bot that weighs it.
export const DOVE: Animal = {
	emoji: "🕊️",
	tint: "#8aa4c6",
	definition: {
		id: "dove",
		search: { depth: 1 },
		weights: {
			givesMate: -1,
			givesCheck: -1000,
			captureValue: -100,
		},
	},
};
