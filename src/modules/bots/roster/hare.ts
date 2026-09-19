import type { Animal } from "./types";

// Never in reach, always moving: `offeredMaterial` prices every piece it would leave catchable —
// counted once per way it can be taken — and `mobility` keeps it light on its feet. At depth 3 the
// search checks the threat instead of trusting the count. `offeredMaterial` is its own (the
// Lemming reads it with the sign flipped); `mobility` is the Spider's lead, borrowed at half the
// weight.
//
// The lab's best pair at depth 3, and level with the old `offeredMaterial` + `hanging` Hare.
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
