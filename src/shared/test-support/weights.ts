import { defaultRecord, type PhaseWeights, weightsFromRecord } from "../eval";

// One weight set used for all three phases, for tests that do not care about the phase blend.
// Anything not named is silent, so a test turns on exactly one feature and sees what it alone
// does.
export function onlyWeights(record: Record<string, number>): PhaseWeights {
	const weights = weightsFromRecord(record);

	return { opening: weights, middlegame: weights, endgame: weights };
}

// The same, but on top of the registry's suggested defaults — a plausible, if untuned, player.
export function defaultishWeights(record: Record<string, number> = {}): PhaseWeights {
	const weights = weightsFromRecord({ ...defaultRecord(), ...record });

	return { opening: weights, middlegame: weights, endgame: weights };
}
