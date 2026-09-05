// Where a feature comes from. The extractor walks the board once per family, and the weight
// editor groups its sliders the same way.
export type FeatureFamily =
	// Counted from the board.
	| "material"
	| "positional"
	| "king"
	// The animal in the bot: the Elo World strategies, expressed as ordinary weights.
	| "behavioural"
	// A property of the move that produced the position, not of the position itself.
	| "move";

export type FeatureDefinition = {
	// Stable identifier. It is what a bot config stores, what a UCI `setoption` names, and what
	// the locale files key their labels on, so renaming one breaks saved bots — don't.
	key: string;
	family: FeatureFamily;
	// Sub-heading inside the family, for the weight editor.
	group: string;
	defaultWeight: number;
};

export type Feature = FeatureDefinition & {
	// Index into every feature and weight vector. Assigned from registry order, never stored.
	id: number;
	i18nKey: string;
};

// Assigns dense ids in declaration order and rejects a duplicate key, which would otherwise show
// up much later as two sliders silently driving the same weight.
export function defineFeatures(definitions: readonly FeatureDefinition[]): Feature[] {
	const seen = new Set<string>();

	return definitions.map((definition, id) => {
		if (seen.has(definition.key)) throw new Error(`duplicate feature key "${definition.key}"`);
		seen.add(definition.key);

		return { ...definition, id, i18nKey: `feature.${definition.key}` };
	});
}

// The vocabulary every bot is described in. Entries are appended as their extraction lands; the
// order is the vector layout, so entries are never reordered or removed.
//
// **Every weight is in centipawns**, and a pawn is 100. That is the whole convention, and it is
// what makes a weight readable: `mobility: 4` says a square of activity is worth four hundredths
// of a pawn, and `swarm: -900` says walking the army a king-move closer is worth a queen. A bot
// that wants a feature to dominate says so with a big number, not by shrinking everything else —
// the roster used to price a pawn at 20 so that `huddle` could outweigh it, which made every
// animal's numbers unreadable and comparable to nothing.
//
// The two game-enders are the only exception: they are preferences in [-1, 1], because what they
// price is not worth a number of pawns. See `terminal.ts`.
export const FEATURES = defineFeatures([
	// Piece values are features rather than constants, so a bot can be given its own — one that
	// thinks a rook is worth two knights is one number away.
	{ key: "materialPawn", family: "material", group: "pieces", defaultWeight: 100 },
	{ key: "materialKnight", family: "material", group: "pieces", defaultWeight: 320 },
	{ key: "materialBishop", family: "material", group: "pieces", defaultWeight: 330 },
	{ key: "materialRook", family: "material", group: "pieces", defaultWeight: 500 },
	{ key: "materialQueen", family: "material", group: "pieces", defaultWeight: 900 },

	// King safety is counted around the king rather than on it: what attacks the squares he stands
	// among, and how exposed he is once the pawns in front of him are gone. A `kingRingDefenders`
	// count sat here too and the lab rated it −46 against bare material — defenders that are just
	// pieces standing near the king, with no read on whether they defend anything, told the
	// evaluation to keep its army home and lose.
	{ key: "kingAttackers", family: "king", group: "safety", defaultWeight: -12 },
	{ key: "kingOpenFile", family: "king", group: "safety", defaultWeight: -20 },
	// Endgame business: the king is a piece, and it wants to be near the pawns.
	{ key: "kingPawnDistance", family: "king", group: "endgame", defaultWeight: -4 },

	// The animals. Every Elo World strategy is a weight here rather than a separate player class,
	// so a bot can be one part swarm, one part material, and rated on the same scale as the rest.
	{ key: "swarm", family: "behavioural", group: "distance", defaultWeight: 0 },
	{ key: "huddle", family: "behavioural", group: "distance", defaultWeight: 0 },
	{ key: "kingProximity", family: "behavioural", group: "distance", defaultWeight: 0 },
	{ key: "reverseStarting", family: "behavioural", group: "distance", defaultWeight: 0 },
	{ key: "sameColorSquares", family: "behavioural", group: "shape", defaultWeight: 0 },
	// The rank-flip mirror alone — the copycat symmetry, and the only one of the three an animal
	// has ever wanted. A pawn on e4 facing a pawn on e5 costs nothing, so maximising it answers
	// every move with the same move.
	{ key: "symmetryMirrorY", family: "behavioural", group: "shape", defaultWeight: 0 },
	{ key: "opponentMobility", family: "behavioural", group: "pressure", defaultWeight: 0 },
	{ key: "pushDepth", family: "behavioural", group: "pressure", defaultWeight: 0 },
	{ key: "offeredMaterial", family: "behavioural", group: "pressure", defaultWeight: 0 },

	// Properties of the move that produced the position. They are what let `cccp` and `pacifist`
	// be weights rather than special-cased players. See `families/move.ts` for the sign
	// convention: a positive weight always means "the mover wants this".
	// The two game-enders are **preferences in [-1, 1]**, not scores: +1 chases it, -1 flees it,
	// 0 cannot see it. They are the only weights that are not centipawns, because the thing they
	// price is not worth a number of pawns — see `terminal.ts`.
	{ key: "givesMate", family: "move", group: "forcing", defaultWeight: 1 },
	{ key: "givesCheck", family: "move", group: "forcing", defaultWeight: 0 },
	// The paper calls out `min_oppt_moves` for not telling mate from stalemate "despite these
	// having very different results". A separate preference is what lets a bot tell them apart —
	// and lets one that would rather draw say so.
	{ key: "givesStalemate", family: "move", group: "forcing", defaultWeight: 0 },
	{ key: "captureValue", family: "move", group: "forcing", defaultWeight: 0 },
	{ key: "isPromotion", family: "move", group: "forcing", defaultWeight: 0 },

	{ key: "centerControl", family: "positional", group: "control", defaultWeight: 8 },
	{ key: "space", family: "positional", group: "control", defaultWeight: 2 },
	{ key: "hanging", family: "positional", group: "control", defaultWeight: -15 },

	{ key: "mobility", family: "positional", group: "activity", defaultWeight: 4 },

	// A strategic stand-in for a piece-square table, role-agnostic on purpose: how far the minor
	// and major pieces stand from the rim. It replaced twelve per-role sliders (a centralization
	// and an advancement for each of the six roles) that no animal used, and the lab then rated it
	// a top-three feature on its own — a knight wanting the centre and a rook wanting the seventh
	// are the same instinct, and one number says it. The paired `advancement` term for pawns went
	// with the rest of the pawn family: every pawn-structure weight the registry carried — passed,
	// the lumped weakness, forwardness — measured at or below bare material in the lab, so the
	// family is gone rather than kept as a drawer of dead sliders.
	{ key: "centralization", family: "positional", group: "placement", defaultWeight: 0 },
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
