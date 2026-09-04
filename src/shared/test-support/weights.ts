import { defaultRecord, type WeightVector, weightsFromRecord } from "../eval";

// Anything not named is silent, so a test turns on exactly one feature and sees what it alone
// does.
export function onlyWeights(record: Record<string, number>): WeightVector {
	return weightsFromRecord(record);
}

// The same, but on top of the registry's suggested defaults — a plausible, if untuned, player.
export function defaultishWeights(record: Record<string, number> = {}): WeightVector {
	return weightsFromRecord({ ...defaultRecord(), ...record });
}
