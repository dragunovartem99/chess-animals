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
export const FEATURES = defineFeatures([
	// Piece values are features rather than constants, so a bot can be given its own — and can
	// value a rook differently in the opening than in the endgame.
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

	{ key: "centerControl", family: "positional", group: "control", defaultWeight: 8 },
	{ key: "space", family: "positional", group: "control", defaultWeight: 2 },
	{ key: "hanging", family: "positional", group: "control", defaultWeight: 15 },

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
