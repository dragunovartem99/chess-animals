import type { Animal } from "./types";

// Prices every piece it would leave catchable — counted once per way it can be taken, so a piece
// three enemies eye is charged three times — and won't play the move that raises the total, while
// watching the four centre squares for the next trap. `offeredMaterial` is its own (the Lemming
// reads it with the sign flipped); `centerControl` is the partner no other animal carries, and the
// lab put it level with or a little above `offeredMaterial` −30 alone.
export const FOX: Animal = {
	emoji: "🦊",
	tint: "#c2632e",
	definition: {
		id: "fox",
		search: { depth: 2 },
		base: "material",
		weights: { offeredMaterial: -20, centerControl: 15 },
	},
};
