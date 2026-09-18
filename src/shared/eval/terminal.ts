import type { Chess } from "chessops/chess";

import { featureId } from "./features";
import type { WeightVector } from "./vector";

const GIVES_MATE = featureId("givesMate");

// The unit a game-ending position is scored in, and the reason `givesMate` is a preference in
// [-1, 1] rather than a number somebody has to guess. It only has to sit clear of the range an
// ordinary evaluation reaches — a full board of classical piece values is under ten thousand.
export const MATE_SCORE = 100_000;

export type TerminalTerm = { id: number; value: number };

// Mate is not a heuristic, so it is not a term in the dot product: it **replaces** the evaluation
// rather than adding to it — the engine's `terminal_score`, read here at the root the breakdown
// explains, where no ply has decayed it.
//
// `value` is in the side to move's frame like every other feature — the side that is mated is the
// one on move — and multiplying by the weight puts the sign the right way round: a preference of
// +1 chases mate, -1 flees it, and 0 means the bot cannot see one at all and scores the position
// like any other. That last case is the paper's `random_move`, and it is why this returns
// `undefined` instead of zero: an indifferent bot must still evaluate the position normally.
//
// Stalemate is not scored here, so it evaluates like any other position.
export function terminalTerm({
	position,
	weights,
}: {
	position: Chess;
	weights: WeightVector;
}): TerminalTerm | undefined {
	if (weights[GIVES_MATE] !== 0 && position.isCheckmate()) {
		return { id: GIVES_MATE, value: -MATE_SCORE };
	}

	return undefined;
}
