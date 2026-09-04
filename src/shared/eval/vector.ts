import { FEATURE_COUNT, FEATURES, FEATURES_BY_KEY } from "./features";

// One scalar per feature, read off a position. Float32 because the whole point is that a bot's
// move is one dot product, and these arrays are allocated per node.
export type FeatureVector = Float32Array;

// One weight per feature. A bot carries three of these — opening, middlegame, endgame.
export type WeightVector = Float32Array;

export function createFeatureVector(): FeatureVector {
	return new Float32Array(FEATURE_COUNT);
}

// The registry's suggested starting point — what the weight editor opens a brand-new bot on.
// Deliberately *not* what an unnamed weight falls back to; see `weightsFromRecord`.
export function defaultWeights(): WeightVector {
	return Float32Array.from(FEATURES, (feature) => feature.defaultWeight);
}

export function defaultRecord(): Record<string, number> {
	return Object.fromEntries(FEATURES.map((feature) => [feature.key, feature.defaultWeight]));
}

// Bots are stored as `{ swarm: 1.2 }` rather than as a bare array of numbers, so a config stays
// readable and survives new features being appended.
//
// A feature the record does not name is **zero**, not its registry default. That matters more
// than it looks: a stored bot must keep playing exactly the way it did when it was saved, and if
// unnamed meant "default" then appending a feature would silently rewrite every bot ever tuned,
// every golden game, and every cached tournament result. A record says everything about a bot.
export function weightsFromRecord(record: Readonly<Record<string, number>>): WeightVector {
	const weights = new Float32Array(FEATURE_COUNT);

	for (const [key, value] of Object.entries(record)) {
		const feature = FEATURES_BY_KEY.get(key);
		if (!feature) throw new Error(`unknown feature key "${key}"`);

		weights[feature.id] = value;
	}

	return weights;
}

// The inverse, keeping every weight that does anything — the shape a tuned bot is exported in.
export function recordFromWeights(weights: WeightVector): Record<string, number> {
	const record: Record<string, number> = {};

	for (const feature of FEATURES) {
		if (weights[feature.id] !== 0) record[feature.key] = weights[feature.id];
	}

	return record;
}

// What a position is worth: the features times the weights on them.
//
// `slots` is the sparse index list from `liveSlots`. Everything outside it is weighted zero and
// contributes nothing, so it is not walked — which for a bot that names four features is the
// difference between four multiplications a node and sixty-two.
export function dot({
	features,
	weights,
	slots,
}: {
	features: FeatureVector;
	weights: WeightVector;
	slots: readonly number[];
}): number {
	let total = 0;
	for (const slot of slots) total += features[slot] * weights[slot];

	return total;
}
