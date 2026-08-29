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
	// Having the move is worth something in itself. It is also the one feature that needs no
	// board walk at all, which makes it the registry's worked example.
	{ key: "tempo", family: "positional", group: "initiative", defaultWeight: 10 },
]);

export const FEATURE_COUNT = FEATURES.length;

export const FEATURES_BY_KEY = new Map(FEATURES.map((feature) => [feature.key, feature]));
