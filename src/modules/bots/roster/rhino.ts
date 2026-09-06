import type { Animal } from "./types";

// The Spider's instinct pushed both ways: `mobility` is our reachable squares minus theirs, and
// `opponentMobility` at a negative weight pays again for every square taken off the other side.
// The Spider (depth 2, `mobility` alone) is the control for the first half and the Owl (depth 3,
// no idea) for the ply, so the Rhino's place says what pressing the squares from both ends is
// worth: fourth, level with the Bear, below the Hare's prophylaxis pair.
export const RHINO: Animal = {
	emoji: "🦏",
	tint: "#5f6a66",
	definition: {
		id: "rhino",
		search: { depth: 3 },
		temperature: 0,
		base: "material",
		weights: { mobility: 10, opponentMobility: -8 },
	},
};
