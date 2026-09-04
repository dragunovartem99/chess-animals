import type { BotDefinition } from "../bots";

type WeightRecords = BotDefinition["weights"];

// Which weights a tuner may move: a list of feature keys, ordered so the parameter vector is
// stable across a run.
export type TuneSpec = { keys: string[] };

// Every feature the bot actually names. Tuning only the author's keys keeps the search small and
// the personality recognisable — a zero left alone stays zero.
export function defaultTuneSpec(weights: WeightRecords): TuneSpec {
	return { keys: Object.keys(weights) };
}

export function toVector(weights: WeightRecords, spec: TuneSpec): number[] {
	return spec.keys.map((key) => weights[key] ?? 0);
}

// The bot's weights with the spec'd keys replaced by the vector, everything else untouched.
export function fromVector(
	weights: WeightRecords,
	spec: TuneSpec,
	vector: readonly number[]
): WeightRecords {
	const next = { ...weights };
	for (const [index, key] of spec.keys.entries()) next[key] = vector[index];

	return next;
}
