import type { WeightVector } from "./vector";

export type PhaseWeights = {
	opening: WeightVector;
	middlegame: WeightVector;
	endgame: WeightVector;
};

// The three sets are interpolated along the phase axis rather than switched between: a hard
// switch puts a step in the evaluation, and bots shuffle back and forth across it. `phase` is
// `gamePhase()` — 0 at full material, 1 at bare kings — with the middlegame set at the midpoint.
export function interpolateWeights({
	weights,
	phase,
}: {
	weights: PhaseWeights;
	phase: number;
}): WeightVector {
	const clamped = Math.min(Math.max(phase, 0), 1);
	const [from, to, position] =
		clamped < 0.5
			? [weights.opening, weights.middlegame, clamped * 2]
			: [weights.middlegame, weights.endgame, (clamped - 0.5) * 2];

	const blended = new Float32Array(from.length);
	for (let index = 0; index < blended.length; index += 1) {
		blended[index] = from[index] + (to[index] - from[index]) * position;
	}

	return blended;
}
