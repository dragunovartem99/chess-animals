import type { Animal } from "./types";

// No idea of its own — the `material` base and nothing written over it. It exists to answer one
// question about every other animal: is a given blunder the animal's personality, or just what
// the search does with any weight vector? Play it next to a one-idea animal at the same depth
// and the difference is what the idea is actually costing.
export const MONKEY: Animal = {
	emoji: "🐒",
	tint: "#b56a43",
	definition: {
		id: "monkey",
		search: { depth: 2 },
		temperature: 0,
		base: "material",
		weights: {},
	},
};
