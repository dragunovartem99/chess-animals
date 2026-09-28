import type { Animal } from "./types";

export const SHARK: Animal = {
	emoji: "🦈",
	tint: "#5f7f96",
	definition: {
		id: "shark",
		search: { depth: 1 },
		maia: { elo: 2300, greedy: true },
		weights: {},
	},
};
