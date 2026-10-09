import type { Animal } from "./types";

// `mobility` 10, the middle of a flat 6–15 plateau. Depth 1, the only material animal that never
// sees a reply — what puts it between the Goat and the Parrot.
export const SPIDER: Animal = {
	emoji: "🕷️",
	tint: "#5f5a54",
	definition: {
		id: "spider",
		search: { depth: 1 },
		base: "material",
		weights: { mobility: 10 },
	},
};
