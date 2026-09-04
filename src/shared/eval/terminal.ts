import type { Chess } from "chessops/chess";

import { featureId } from "./features";
import type { WeightVector } from "./vector";

const GIVES_MATE = featureId("givesMate");
const GIVES_STALEMATE = featureId("givesStalemate");

// The unit a game-ending position is scored in, and the reason `givesMate` is a preference in
// [-1, 1] rather than a number somebody has to guess. It only has to sit clear of the range an
// ordinary evaluation reaches — a full board of classical piece values is under ten thousand.
export const MATE_SCORE = 100_000;

export type TerminalTerm = { id: number; value: number };

// Mate is not a heuristic, so it is not a term in the dot product: it **replaces** the evaluation
// rather than adding to it.
//
// Adding was the bug. Every mate scored the same 100000 whatever its distance, and the leaf of a
// mate-in-3 then collected three plies of positional bonus on top, so every animal in the roster
// walked past a mate in one to play a slower one. Both halves are fixed here: the score decays
// with `ply`, so the shortest mate wins, and nothing else is added to it, so no bonus can outbid
// it.
//
// `value` is in the side to move's frame like every other feature — the side that is mated is the
// one on move — and multiplying by the weight puts the sign the right way round: a preference of
// +1 chases mate, -1 flees it, and 0 means the bot cannot see one at all and scores the position
// like any other. That last case is the paper's `random_move`, and it is why this returns
// `undefined` instead of zero: an indifferent bot must still evaluate the position normally.
//
// Stalemate is scored on the same scale on purpose. `min_oppt_moves` squeezes towards both and
// the paper calls out that it cannot tell them apart; here +1 wants the stalemate as much as the
// mate, and -1 dreads it as much as being mated.
export function terminalTerm({
	position,
	weights,
	ply = 0,
}: {
	position: Chess;
	weights: WeightVector;
	ply?: number;
}): TerminalTerm | undefined {
	// The weight is checked before the position: `isStalemate` walks for a legal move, and a bot
	// that does not care about stalemate should not pay for that on every node of every search.
	if (weights[GIVES_MATE] !== 0 && position.isCheckmate()) {
		return { id: GIVES_MATE, value: -(MATE_SCORE - ply) };
	}

	if (weights[GIVES_STALEMATE] !== 0 && position.isStalemate()) {
		return { id: GIVES_STALEMATE, value: -(MATE_SCORE - ply) };
	}

	return undefined;
}

// What the search scores a game-ending position at, or `undefined` if this position does not end
// the game — or ends it in a way this bot has no opinion about.
export function terminalScore({
	position,
	weights,
	ply = 0,
}: {
	position: Chess;
	weights: WeightVector;
	ply?: number;
}): number | undefined {
	const term = terminalTerm({ position, weights, ply });

	return term && term.value * weights[term.id];
}
