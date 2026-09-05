import type { Animal } from "./types";

// The paper's `generous`, and the Fox turned inside out: `offeredMaterial` is our material sitting
// where the opponent can take it, counted once per piece that attacks it and weighted by value.
// The Fox drives it to zero and rates just off the top of the roster; the Lemming drives it as
// high as it will go and marches the whole army off the cliff.
//
// No base, so it never once weighs what the gift costs — the pieces are there to be given. Depth
// 1: the offer is a property of the position in front of it, not a plan. The arena has it a
// clear tier below the Donkey (633 to 789, and the Donkey takes four games in five between
// them) — it is the roster's most committed loser after the Dove.
export const LEMMING: Animal = {
	emoji: "🐹",
	tint: "#b07a4a",
	definition: {
		id: "lemming",
		search: { depth: 1 },
		temperature: 0,
		weights: { offeredMaterial: 100 },
	},
};
