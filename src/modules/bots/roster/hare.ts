import type { Animal } from "./types";

// The Fox and the Hedgehog folded into one, a ply deeper. `offeredMaterial` prices every piece it
// would leave under attack, `hanging` the ones it would leave undefended; at depth 3 the search
// checks the threat instead of trusting the count. Two ways of saying "lose nothing", and it is
// second on the roster for it — behind only the Raven's quiescence, ahead of every other idea.
// The first animal built on two features.
export const HARE: Animal = {
	emoji: "🐇",
	tint: "#a89a86",
	definition: {
		id: "hare",
		search: { depth: 3 },
		temperature: 0,
		base: "material",
		weights: { offeredMaterial: -20, hanging: -100 },
	},
};
