import type { Animal } from "./types";

// The constrictor: it wants you to have nowhere to go. `opponentMobility` counts the squares the
// other side reaches, so a negative weight pays for every one taken off it — the Spider's
// `mobility` read from the far end, with no care for how many squares it has itself.
//
// It replaced the Rhino, which paired this with `mobility` and was already mostly a squeeze: the
// two terms net out at ten points per square of its own against eighteen per square of yours.
// Dropping the first leaves the one instinct, frees the Spider's weight, and keeps the lab's
// rating — at -10 it sits a step above the Owl, level with the Bear. Heavier weights sank it
// onto the Owl.
export const SNAKE: Animal = {
	emoji: "🐍",
	tint: "#5b7a3a",
	definition: {
		id: "snake",
		search: { depth: 3 },
		base: "material",
		weights: { opponentMobility: -10 },
	},
};
