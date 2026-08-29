import type { Chess } from "chessops/chess";

import { gamePhase } from "../chess";
import {
	dot,
	extractFeatures,
	interpolateWeights,
	type PhaseWeights,
	type PlayedMove,
} from "../eval";

// What a position is worth to the side to move, in whatever units the weights are written in
// (centipawns, by convention, since that is what the default material weights are).
//
// The three weight sets are blended by game phase first, so the same call serves an opening and a
// bare-kings endgame without the evaluation stepping as pieces come off.
export function evaluatePosition({
	position,
	played,
	weights,
}: {
	position: Chess;
	played?: PlayedMove;
	weights: PhaseWeights;
}): number {
	const blended = interpolateWeights({ weights, phase: gamePhase(position) });

	return dot(extractFeatures({ position, played }), blended);
}
