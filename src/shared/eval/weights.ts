import type { WeightVector } from "./vector";

export type PhaseWeights = {
	opening: WeightVector;
	middlegame: WeightVector;
	endgame: WeightVector;
};

// The slots a bot actually weighs, in any phase — an animal names a handful of the sixty-odd
// features and leaves the rest at zero.
//
// A weight that is zero in all three phases is zero through every blend between them, so its
// feature can never change a score. That makes this list the whole of what a search has to do:
// the extractor runs only the families it touches, and the dot product walks only these slots
// instead of multiplying fifty-odd zeros.
export function liveSlots(weights: PhaseWeights): number[] {
	const live: number[] = [];

	for (let slot = 0; slot < weights.middlegame.length; slot += 1) {
		const zero =
			weights.opening[slot] === 0 &&
			weights.middlegame[slot] === 0 &&
			weights.endgame[slot] === 0;

		if (!zero) live.push(slot);
	}

	return live;
}

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
