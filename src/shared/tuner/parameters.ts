import type { BotDefinition, Phase } from "../bots";

type WeightRecords = BotDefinition["weights"];

// Which weights a tuner may move: a flat list of (phase, feature key) cells, ordered so the
// parameter vector is stable across a run.
export type TuneSpec = { phases: Phase[]; keys: string[] };

const ALL_PHASES: Phase[] = ["opening", "middlegame", "endgame"];

// Every feature the bot actually names, in every phase it defines. Tuning only the author's keys
// keeps the search small and the personality recognisable — a zero left alone stays zero.
export function defaultTuneSpec(weights: WeightRecords): TuneSpec {
	const phases = ALL_PHASES.filter((phase) => weights[phase]);
	const keys = [...new Set(phases.flatMap((phase) => Object.keys(weights[phase] ?? {})))];
	return { phases, keys };
}

export function toVector(weights: WeightRecords, spec: TuneSpec): number[] {
	return spec.phases.flatMap((phase) => spec.keys.map((key) => weights[phase]?.[key] ?? 0));
}

// The bot's weights with the spec'd cells replaced by the vector, everything else untouched.
export function fromVector(
	weights: WeightRecords,
	spec: TuneSpec,
	vector: readonly number[]
): WeightRecords {
	const next: WeightRecords = { middlegame: { ...weights.middlegame } };
	if (weights.opening) next.opening = { ...weights.opening };
	if (weights.endgame) next.endgame = { ...weights.endgame };

	let index = 0;
	for (const phase of spec.phases) {
		const record = { ...next[phase] };
		for (const key of spec.keys) {
			record[key] = vector[index];
			index += 1;
		}
		next[phase] = record;
	}
	return next;
}
