import type { Animal } from "./types";

// Hems you in and gets caught by nothing, a ply deeper than the Hedgehog. `opponentMobility`
// prices every square it takes from you, and no other animal reads it; `hanging` keeps its own
// pieces defended while it does. At depth 3 the search checks the threat instead of trusting the
// count.
//
// It used to be the Fox and the Hedgehog folded together (`offeredMaterial` + `hanging`). The lab
// had the two within noise of each other, so the Hare takes the idea nobody else has.
export const HARE: Animal = {
	emoji: "🐇",
	tint: "#a89a86",
	definition: {
		id: "hare",
		search: { depth: 3 },
		base: "material",
		weights: { opponentMobility: -8, hanging: -100 },
	},
};
