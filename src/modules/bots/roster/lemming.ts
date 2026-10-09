import type { Animal } from "./types";

// The paper's `generous`: drives `offeredMaterial` as high as it goes. No base, so it never weighs
// what a gift costs; depth 1, since the offer is in the position, not a plan.
export const LEMMING: Animal = {
	emoji: "🐹",
	tint: "#b07a4a",
	definition: {
		id: "lemming",
		search: { depth: 1 },
		weights: { offeredMaterial: 100 },
	},
};
