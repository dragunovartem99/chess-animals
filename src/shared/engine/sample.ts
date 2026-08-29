import type { Rng } from "./rng";

// The index of the highest score, ties broken by the caller's rng. Deterministic bots would
// otherwise repeat one another's games move for move, and the arena would learn nothing from
// playing them twice.
export function argmaxIndex({ scores, rng }: { scores: readonly number[]; rng: Rng }): number {
	if (scores.length === 0) throw new Error("cannot take the argmax of an empty score list");

	let best = -Infinity;
	let tied: number[] = [];

	for (const [index, score] of scores.entries()) {
		if (score > best) {
			best = score;
			tied = [index];
		} else if (score === best) {
			tied.push(index);
		}
	}

	return rng.pick(tied);
}

// Samples an index with probability proportional to `exp(score / temperature)`. `temperature` is
// in the same units as the scores, so it reads as "how many points of evaluation the bot is
// willing to throw away"; at or below zero this is a plain argmax.
export function softmaxSample({
	scores,
	temperature,
	rng,
}: {
	scores: readonly number[];
	temperature: number;
	rng: Rng;
}): number {
	if (temperature <= 0) return argmaxIndex({ scores, rng });
	if (scores.length === 0) throw new Error("cannot sample from an empty score list");

	// Shifting by the maximum keeps `exp` away from overflow without changing the distribution.
	const best = Math.max(...scores);
	const weights = scores.map((score) => Math.exp((score - best) / temperature));
	const total = weights.reduce((sum, weight) => sum + weight, 0);

	// A degenerate spread (every weight underflowed to zero) falls back to the best move rather
	// than to whatever index the running sum happens to stop on.
	if (!Number.isFinite(total) || total === 0) return argmaxIndex({ scores, rng });

	let remaining = rng.float() * total;
	for (const [index, weight] of weights.entries()) {
		remaining -= weight;
		if (remaining < 0) return index;
	}

	return weights.length - 1;
}
