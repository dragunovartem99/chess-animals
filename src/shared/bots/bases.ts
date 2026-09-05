// The starting points a bot can be written on top of.
//
// Without these, every animal repeated the same seven lines to say "and it knows what a rook is
// worth", and the one line that was actually the animal got lost among them. The Hedgehog is
// greed with one instinct; that is what its file should say, and now it does.
//
// A base is **frozen literal numbers**, never derived from the registry's `defaultWeight`. That
// is the whole point: `defaultWeight` is a suggestion the registry is free to retune, and if a
// base tracked it then retuning one number would silently restrain every bot ever written on it,
// every golden game and every cached tournament result. To change what a base means, add a new
// base — `bases.test.ts` pins each of these to the numbers committed here.
export const BASES = {
	// Nothing at all. The paper's `random_move`, and what a bot gets if it names no base: a
	// definition that says nothing means nothing, which is what makes a bot file readable.
	zero: {},

	// Sees a checkmate and takes it, and has no other opinion whatsoever. The floor for a bot
	// that is meant to play a strategy rather than wander.
	mate: { givesMate: 1 },

	// The classical piece values, and the mate. The least a bot needs to be recognisably playing
	// chess before its own idea is added on top.
	material: {
		givesMate: 1,
		materialPawn: 100,
		materialKnight: 300,
		materialBishop: 300,
		materialRook: 500,
		materialQueen: 900,
	},
} as const satisfies Record<string, Record<string, number>>;

export type BaseName = keyof typeof BASES;

export const BASE_NAMES = Object.keys(BASES) as BaseName[];

// A bot's weights: its base, with everything the definition names written over the top. Naming a
// feature the base already sets replaces it rather than adding to it, so an animal can always
// disagree with its base in one line.
export function weightsOn({
	base = "zero",
	weights,
}: {
	base?: BaseName;
	weights: Record<string, number>;
}): Record<string, number> {
	return { ...BASES[base], ...weights };
}
