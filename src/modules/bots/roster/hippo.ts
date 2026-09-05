import type { Animal } from "./types";

// Pulls every piece off the rim and toward the four centre squares — the one `centralization`
// number standing in for a piece-square table. Named for the Hippopotamus defence, which builds
// the same clamp on the centre from behind its own pawns.
export const HIPPO: Animal = {
	emoji: "🦛",
	tint: "#6a6a94",
	definition: {
		id: "hippo",
		search: { depth: 2 },
		temperature: 0,
		base: "material",
		weights: { centralization: 20 },
	},
};
