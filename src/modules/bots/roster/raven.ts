import type { Animal } from "./types";

// The Owl with one thing added: depth 3, no personality feature, but `quiescence` on, so every
// capture chain is played out before the position is judged. It is the control for the question
// the plain Monkey–Owl ladder cannot answer — what is resolving the trades past the leaf worth? —
// and the answer turned out to be "more than anything else on the roster". On a material-only
// search the blunder that matters is taking a piece that is recaptured, and this is the animal
// that stops doing it.
export const RAVEN: Animal = {
	emoji: "🐦‍⬛",
	tint: "#3f4550",
	definition: {
		id: "raven",
		search: { depth: 3, quiescence: true },
		temperature: 0,
		base: "material",
		weights: {},
	},
};
