import type { Animal } from "./types";

// `huddle` pulls the army home around the king; the `material` base keeps it from hanging pieces.
// 550 lands mid-gap: 400 nearly reached the Wolf, 900 sat on the Parrot.
export const SLOTH: Animal = {
	emoji: "🦥",
	tint: "#8a7a5c",
	definition: {
		id: "sloth",
		search: { depth: 2 },
		base: "material",
		weights: { huddle: 550 },
	},
};
