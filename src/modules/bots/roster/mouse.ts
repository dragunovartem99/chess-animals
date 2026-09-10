import type { Animal } from "./types";

// Runs into its hole and stays there: `castled` pays it to tuck its king away, `offeredMaterial`
// to keep every piece out of reach, and a negative `captureValue` makes it flinch from a fight.
// The one animal that reads `castled`.
//
// The flinch is the calibration. At depth 1 with no base, a refusal heavier than the hiding
// terms is the Dove's never-take-anything and rates on it; lighter, and the hiding outbids it
// often enough that it takes what is offered and climbs onto the Lemming. At -40 it is refused
// most of the time and taken when leaving it would put a piece in reach — which the lab put a
// little past the middle of the Dove-to-Lemming gap. (It once hit that gap with a temperature
// instead; the temperature is gone.)
//
// No base, and no `givesMate`: it cannot see a mate either way.
export const MOUSE: Animal = {
	emoji: "🐁",
	tint: "#9e9aa6",
	definition: {
		id: "mouse",
		search: { depth: 1 },
		weights: { castled: 100, captureValue: -40, offeredMaterial: -20 },
	},
};
