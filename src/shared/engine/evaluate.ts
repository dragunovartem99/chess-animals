import type { Chess } from "chessops/chess";

import { gamePhase } from "../chess";
import {
	createFeatureVector,
	dot,
	extractFeatures,
	interpolateWeights,
	type PhaseWeights,
	type PlayedMove,
	type WeightVector,
} from "../eval";

export type PositionEvaluator = (frame: { position: Chess; played?: PlayedMove }) => number;

// A scorer bound to one bot's weights, holding the scratch it reuses between calls. The search
// makes one of these per `go` and calls it once per node, so the two allocations a naive
// `evaluate` would make every node — the blended weight vector and the feature vector — become
// one each per phase and one for the whole search.
//
// `gamePhase` is `1 - m / 24` for integer non-pawn material `m`, so it takes at most 25 distinct
// values across a whole game: the blend cache is exact, not an approximation, and it is discarded
// with the evaluator when the search ends, so a `setoption` that retunes the bot is never stale.
export function createEvaluator({ weights }: { weights: PhaseWeights }): PositionEvaluator {
	const blendByPhase = new Map<number, WeightVector>();
	const scratch = createFeatureVector();

	return function evaluate({ position, played }): number {
		const phase = gamePhase(position);

		let blended = blendByPhase.get(phase);
		if (!blended) {
			blended = interpolateWeights({ weights, phase });
			blendByPhase.set(phase, blended);
		}

		return dot(extractFeatures({ position, played, into: scratch }), blended);
	};
}

// What a position is worth to the side to move, in whatever units the weights are written in
// (centipawns, by convention). A one-shot convenience over `createEvaluator` for callers that
// score a single position and throw the scorer away.
export function evaluatePosition({
	position,
	played,
	weights,
}: {
	position: Chess;
	played?: PlayedMove;
	weights: PhaseWeights;
}): number {
	return createEvaluator({ weights })({ position, played });
}
