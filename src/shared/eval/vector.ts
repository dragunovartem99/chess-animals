import { FEATURE_COUNT, FEATURES_BY_KEY } from "./features";

// One scalar per feature, read off a position — the engine's float32s, as `extract` returns them.
export type FeatureVector = Float32Array;

// One weight per feature. A bot is one of these and nothing else.
export type WeightVector = Float32Array;

// Bots are stored as `{ swarm: 1.2 }` rather than as a bare array of numbers, so a config stays
// readable and survives new features being appended.
//
// A feature the record does not name is **zero**. That matters more than it looks: a stored bot
// must keep playing exactly the way it did when it was saved, and if unnamed meant anything else
// then appending a feature would silently rewrite every bot ever tuned, every golden game, and
// every cached tournament result. A record says everything about a bot.
export function weightsFromRecord(record: Readonly<Record<string, number>>): WeightVector {
	const weights = new Float32Array(FEATURE_COUNT);

	for (const [key, value] of Object.entries(record)) {
		const feature = FEATURES_BY_KEY.get(key);
		if (!feature) throw new Error(`unknown feature key "${key}"`);

		weights[feature.id] = value;
	}

	return weights;
}
