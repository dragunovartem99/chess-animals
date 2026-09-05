import type { Animal } from "./types";

// The paper's `pacifist`, and the Goat read backwards: avoid the mate, then the check, then the
// capture, and among forced captures take the least. Every weight the Goat makes positive this
// one makes negative, at the same magnitudes — a check still outbids the biggest capture (nine
// pawns), it is just now a thing to run from rather than towards.
//
// No base, so a quiet position scores zero and it moves at random inside the wall of moves that
// touch nothing — which is the whole strategy, not a fallback. `givesMate: -1` is the one weight
// it must carry: the search only scores a mate for a bot that weighs it, and −1 is what makes a
// delivered mate the position it flees hardest. It is why the Dove sits below the Donkey — the
// paper rates the pacifist near the bottom of the whole field, well under uniform random, since
// declining every capture just feeds itself to the opponent.
//
// Depth 1: like the Goat, this is a priority over the moves in front of it, not a plan.
export const DOVE: Animal = {
	emoji: "🕊️",
	tint: "#8aa4c6",
	definition: {
		id: "dove",
		search: { depth: 1 },
		temperature: 0,
		weights: {
			givesMate: -1,
			givesCheck: -1000,
			captureValue: -100,
		},
	},
};
