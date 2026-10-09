import { FEATURE_COUNT, FEATURES_BY_KEY } from "./features";

// One scalar per feature, read off a position — the engine's float32s, as `extract` returns them.
export type FeatureVector = Float32Array;

// One weight per feature. A bot is one of these and nothing else.
export type WeightVector = Float32Array;

// A feature the record doesn't name is zero, so appending a feature never changes how a saved bot
// plays.
export function weightsFromRecord(record: Readonly<Record<string, number>>): WeightVector {
	const weights = new Float32Array(FEATURE_COUNT);

	for (const [key, value] of Object.entries(record)) {
		const feature = FEATURES_BY_KEY.get(key);
		if (!feature) throw new Error(`unknown feature key "${key}"`);

		weights[feature.id] = value;
	}

	return weights;
}
