import { FEATURES, type PhaseWeights, weightsFromRecord } from "../eval";

// Every feature switched off, derived from the registry rather than listed by hand, so a feature
// added later cannot quietly leave its default weight switched on in a test.
export const SILENT: Record<string, number> = Object.fromEntries(
	FEATURES.map((feature) => [feature.key, 0])
);

// One weight set used for all three phases, for tests that do not care about the phase blend.
// Anything not named is silent, so a test turns on exactly one feature and sees what it does
// alone.
export function onlyWeights(record: Record<string, number>): PhaseWeights {
	const weights = weightsFromRecord({ ...SILENT, ...record });

	return { opening: weights, middlegame: weights, endgame: weights };
}

// The same, but on top of the registry's own defaults — a plausible, if untuned, chess player.
export function defaultishWeights(record: Record<string, number> = {}): PhaseWeights {
	const weights = weightsFromRecord(record);

	return { opening: weights, middlegame: weights, endgame: weights };
}
