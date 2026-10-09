import type { Animal } from "./types";

// `huddle` 40 is a preference where the Sloth's 550 is an obsession: strong at home, and heavy to
// dislodge.
export const BEAR: Animal = {
	emoji: "🐻",
	tint: "#6e5647",
	definition: {
		id: "bear",
		search: { depth: 3 },
		base: "material",
		weights: { huddle: 40 },
	},
};
