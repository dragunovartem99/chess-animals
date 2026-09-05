import type { Animal } from "./types";

// Prices every piece it would leave catchable — counted once per way it can be taken, so a piece
// three enemies eye is charged three times — and won't play the move that raises the total.
// Paranoid where the Hedgehog is only tidy: `offeredMaterial` was the lab's strongest feature and
// this is the animal that reads it.
export const FOX: Animal = {
	emoji: "🦊",
	tint: "#c2632e",
	definition: {
		id: "fox",
		search: { depth: 2 },
		temperature: 0,
		base: "material",
		weights: { offeredMaterial: -30 },
	},
};
