import type { Animal } from "./types";

// Keeps its knights and bishops at home and otherwise moves at random — the Donkey that never
// gets its pieces out. `development` is our developed minors minus theirs, so a negative weight
// is the one animal that reads it backwards: every move off the back rank is a move it refuses.
//
// It used to flinch from captures as well, with a temperature to let it sometimes take one. With
// the temperature gone that build is a strict refusal and rates level with the Dove; a hiding
// variant (`offeredMaterial` on top) rated level with the Lemming. `development` alone lands it
// between the Lemming and the Donkey, which is the gap the roster had room for.
//
// No base, and no `givesMate`: it cannot see a mate either way.
export const MOUSE: Animal = {
	emoji: "🐁",
	tint: "#9e9aa6",
	definition: {
		id: "mouse",
		search: { depth: 1 },
		weights: { development: -60 },
	},
};
