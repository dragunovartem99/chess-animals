// Frozen literal numbers, never derived: retuning a base would rewrite every bot, golden game and
// cached result on it. Add a new base instead — `bases.test.ts` pins these.
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
