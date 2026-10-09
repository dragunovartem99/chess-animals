export type FeatureDefinition = {
	// Stable identifier. It is what a bot config stores, what a UCI `setoption` names, and what
	// the locale files key their labels on, so renaming one breaks saved bots — don't.
	key: string;
};

export type Feature = FeatureDefinition & {
	// Index into every feature and weight vector. Assigned from registry order, never stored.
	id: number;
	i18nKey: string;
};

// Assigns dense ids in declaration order and rejects a duplicate key, which would otherwise show
// up much later as two keys silently driving the same weight.
export function defineFeatures(definitions: readonly FeatureDefinition[]): Feature[] {
	const seen = new Set<string>();

	return definitions.map((definition, id) => {
		if (seen.has(definition.key)) throw new Error(`duplicate feature key "${definition.key}"`);
		seen.add(definition.key);

		return { ...definition, id, i18nKey: `feature.${definition.key}` };
	});
}

// Append only: the order is the vector layout. Every weight is in centipawns (a pawn is 100),
// except `givesMate`, a preference in [-1, 1] — see `terminal.ts`.
export const FEATURES = defineFeatures([
	// Piece values are features rather than constants, so a bot can be given its own — one that
	// thinks a rook is worth two knights is one number away.
	{ key: "materialPawn" },
	{ key: "materialKnight" },
	{ key: "materialBishop" },
	{ key: "materialRook" },
	{ key: "materialQueen" },

	// What attacks the squares around the king, ours minus theirs: a negative weight buys safety, a
	// positive one is `suicide_king`.
	{ key: "kingDanger" },

	// The Elo World strategies as weights, so a bot can mix them. Distances are negated, so a
	// positive weight means what the key names (`engine/src/eval/proximity.c`).
	{ key: "swarm" },
	{ key: "huddle" },
	{ key: "kingProximity" },
	// Shape is a property of the whole board, not of a side, so unlike every other feature these
	// read identically from either seat — which is why the animals on them must run at an even
	// depth, negamax flipping a leaf's sign once per ply.
	{ key: "sameColorSquares" },
	// The rank-flip mirror alone — the copycat symmetry, and the only one of the three an animal
	// has ever wanted. A pawn on e4 facing a pawn on e5 costs nothing, so maximising it answers
	// every move with the same move.
	{ key: "mirrorRanks" },
	// The same measurement `mobility` takes of our own side, kept apart so a bot can price taking
	// the opponent's moves away differently from having moves itself.
	{ key: "opponentMobility" },
	{ key: "pushDepth" },
	// Material a side leaves catchable, counted once per way it can be taken. `hanging` below is
	// the same instinct as a count of undefended pieces, and the two together are the Hare — the
	// lab's strongest pair.
	{ key: "offeredMaterial" },

	// Properties of the move that made the position; a positive weight means the mover wants it
	// (`move.c`). `givesMate` is a preference in [-1, 1]: +1 chases mate, -1 flees it, 0 is blind.
	{ key: "givesMate" },
	{ key: "givesCheck" },
	{ key: "captureValue" },

	{ key: "centerControl" },
	{ key: "space" },
	{ key: "hanging" },

	{ key: "mobility" },

	// Distance of minor and major pieces from the rim, role-agnostic on purpose: a knight wanting
	// the centre and a rook the seventh are one instinct.
	{ key: "centralization" },

	// Our knights and bishops off the back rank minus theirs — a plain count of developed minors.
	// There is no game-phase mechanism to gate it because the quantity decays to ~0 on its own
	// once both sides' minors are out or traded.
	{ key: "development" },

	// Our minors still home while our queen is out, minus theirs. No phase gate: it falls to 0 once
	// the minors develop or the queen comes home.
	{ key: "earlyQueen" },

	// King distance from the rim, ours minus theirs, scaled by the square of missing material —
	// inert until the ending (`endgame.c`). A true side difference, so any depth works.
	{ key: "kingActivity" },

	// Passed pawns weighted by advance, ours minus theirs, scaled by missing material — silent in
	// the middlegame, where the old `passed` term measured no better than material.
	{ key: "passedPawnPush" },

	// An `attackEnemyPawns` term — enemy pawns we attack minus ours they attack, faded in the same
	// way — landed with these two and was dropped unused: the Camel, the one endgame animal, never
	// took it, and no animal had an idea it was the whole of.
]);

export const FEATURE_COUNT = FEATURES.length;

export const FEATURES_BY_KEY = new Map(FEATURES.map((feature) => [feature.key, feature]));

// Resolves a key to its vector slot once, at module load, so the extractor never looks anything
// up per node. A typo is a startup crash rather than a feature that silently reads zero.
export function featureId(key: string): number {
	const feature = FEATURES_BY_KEY.get(key);
	if (!feature) throw new Error(`unknown feature key "${key}"`);

	return feature.id;
}
