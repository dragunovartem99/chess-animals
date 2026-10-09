import type { Animal } from "./types";

// `offeredMaterial` prices every piece left catchable and `mobility` keeps it moving; depth 3
// checks the threat rather than trusting the count.
export const HARE: Animal = {
	emoji: "🐇",
	tint: "#a89a86",
	definition: {
		id: "hare",
		search: { depth: 3 },
		base: "material",
		weights: { offeredMaterial: -20, mobility: 5 },
	},
};
