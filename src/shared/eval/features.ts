// Where a feature comes from. The extractor walks the board once per family, and the weight
// editor groups its sliders the same way.
export type FeatureFamily =
	// Counted from the board.
	| "material"
	| "positional"
	| "pawns"
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
	// Piece values are features rather than constants, so a bot can be given its own — a Snake
	// that thinks a rook is worth two knights is one number away.
	{ key: "materialPawn", family: "material", group: "pieces", defaultWeight: 100 },
	{ key: "materialKnight", family: "material", group: "pieces", defaultWeight: 320 },
	{ key: "materialBishop", family: "material", group: "pieces", defaultWeight: 330 },
	{ key: "materialRook", family: "material", group: "pieces", defaultWeight: 500 },
	{ key: "materialQueen", family: "material", group: "pieces", defaultWeight: 900 },

	// A parametrised stand-in for piece-square tables: two numbers per role instead of sixty-four,
	// which is what keeps the tuner's search space small enough to move in seconds.
	{ key: "centralizationPawn", family: "positional", group: "placement", defaultWeight: 0 },
	{ key: "centralizationKnight", family: "positional", group: "placement", defaultWeight: 0 },
	{ key: "centralizationBishop", family: "positional", group: "placement", defaultWeight: 0 },
	{ key: "centralizationRook", family: "positional", group: "placement", defaultWeight: 0 },
	{ key: "centralizationQueen", family: "positional", group: "placement", defaultWeight: 0 },
	{ key: "centralizationKing", family: "positional", group: "placement", defaultWeight: 0 },
	{ key: "advancementPawn", family: "positional", group: "placement", defaultWeight: 0 },
	{ key: "advancementKnight", family: "positional", group: "placement", defaultWeight: 0 },
	{ key: "advancementBishop", family: "positional", group: "placement", defaultWeight: 0 },
	{ key: "advancementRook", family: "positional", group: "placement", defaultWeight: 0 },
	{ key: "advancementQueen", family: "positional", group: "placement", defaultWeight: 0 },
	{ key: "advancementKing", family: "positional", group: "placement", defaultWeight: 0 },

	{ key: "bishopPair", family: "positional", group: "pieces", defaultWeight: 30 },
	{ key: "rookOpenFile", family: "positional", group: "pieces", defaultWeight: 20 },
	{ key: "rookSeventh", family: "positional", group: "pieces", defaultWeight: 20 },
	{ key: "knightOutpost", family: "positional", group: "pieces", defaultWeight: 25 },

	// Pawn structure is the one part of the position that outlives every piece trade, so each
	// trait is its own weight rather than one lumped "structure" score.
	{ key: "pawnDoubled", family: "pawns", group: "weaknesses", defaultWeight: -12 },
	{ key: "pawnIsolated", family: "pawns", group: "weaknesses", defaultWeight: -15 },
	{ key: "pawnBackward", family: "pawns", group: "weaknesses", defaultWeight: -10 },
	{ key: "pawnIslands", family: "pawns", group: "weaknesses", defaultWeight: -8 },
	{ key: "pawnConnected", family: "pawns", group: "strengths", defaultWeight: 8 },
	{ key: "pawnPassed", family: "pawns", group: "strengths", defaultWeight: 25 },
	{ key: "pawnPassedAdvancement", family: "pawns", group: "strengths", defaultWeight: 8 },
	{ key: "pawnShield", family: "pawns", group: "strengths", defaultWeight: 10 },

	// King safety is counted around the king rather than on it: what attacks the squares he stands
	// among, what defends them, and how exposed he is once the pawns in front of him are gone.
	{ key: "kingAttackers", family: "king", group: "safety", defaultWeight: -12 },
	{ key: "kingRingDefenders", family: "king", group: "safety", defaultWeight: 6 },
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
	{ key: "symmetryMirrorX", family: "behavioural", group: "shape", defaultWeight: 0 },
	{ key: "symmetryMirrorY", family: "behavioural", group: "shape", defaultWeight: 0 },
	{ key: "symmetryRot180", family: "behavioural", group: "shape", defaultWeight: 0 },
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
	{ key: "isCastle", family: "move", group: "quiet", defaultWeight: 0 },
	{ key: "movedPawn", family: "move", group: "quiet", defaultWeight: 0 },
	{ key: "movedKnight", family: "move", group: "quiet", defaultWeight: 0 },
	{ key: "movedBishop", family: "move", group: "quiet", defaultWeight: 0 },
	{ key: "movedRook", family: "move", group: "quiet", defaultWeight: 0 },
	{ key: "movedQueen", family: "move", group: "quiet", defaultWeight: 0 },
	{ key: "movedKing", family: "move", group: "quiet", defaultWeight: 0 },

	{ key: "centerControl", family: "positional", group: "control", defaultWeight: 8 },
	{ key: "space", family: "positional", group: "control", defaultWeight: 2 },
	{ key: "hanging", family: "positional", group: "control", defaultWeight: -15 },

	{ key: "mobility", family: "positional", group: "activity", defaultWeight: 4 },
	{ key: "safeMobility", family: "positional", group: "activity", defaultWeight: 3 },
	// Having the move is worth something in itself. It is also the one feature that needs no
	// board walk at all, which makes it the registry's worked example.
	{ key: "tempo", family: "positional", group: "initiative", defaultWeight: 10 },
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
