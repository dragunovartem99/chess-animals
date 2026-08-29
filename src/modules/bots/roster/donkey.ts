import type { Animal } from "./types";

// The paper's `random_move`, and the reference point the whole rating scale hangs from: it can
// play any sequence of moves, so it spans the gamut from the worst possible player to the best.
//
// It needs no special case in the engine. With every weight at zero, every move scores zero, and
// the argmax tie-break picks uniformly among all of them.
export const DONKEY: Animal = {
	emoji: "🐴",
	definition: {
		id: "donkey",
		search: { depth: 1 },
		temperature: 0,
		weights: { middlegame: {} },
	},
};
