import type { Chess } from "chessops/chess";

import {
	createExtractor,
	createFeatureVector,
	dot,
	liveSlots,
	type PlayedMove,
	terminalScore,
	type WeightVector,
} from "../eval";

// `ply` is the distance from the root, and only a game-ending position uses it: it is what makes
// a mate in one beat a mate in three.
export type PositionEvaluator = (frame: {
	position: Chess;
	played?: PlayedMove;
	ply?: number;
	// Passed through to `terminalScore` — see there. Quiescence knows it, the plain search does not.
	inCheck?: boolean;
}) => number;

// A scorer bound to one bot's weights, holding everything it can work out from them up front:
// which features this particular bot is scored on, an extractor that reads only those, and the
// scratch vector it reads them into. The search makes one of these per `go` and calls it once per
// node, so the feature vector a naive `evaluate` would allocate every node becomes one for the
// whole search.
export function createEvaluator({ weights }: { weights: WeightVector }): PositionEvaluator {
	const scratch = createFeatureVector();
	const slots = liveSlots(weights);
	const extract = createExtractor({ slots });

	return function evaluate({ position, played, ply = 0, inCheck }): number {
		// A mate replaces the evaluation rather than joining it — see `terminalScore`.
		const terminal = terminalScore({ position, weights, ply, inCheck });
		if (terminal !== undefined) return terminal;

		return dot({ features: extract({ position, played, into: scratch }), weights, slots });
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
	weights: WeightVector;
}): number {
	return createEvaluator({ weights })({ position, played, ply: 0 });
}
