import { castlingSide } from "chessops/chess";
import type { Chess } from "chessops/chess";
import type { NormalMove } from "chessops/types";
import { kingCastlesTo } from "chessops/util";

import { legalMoves } from "../chess";
import type { Rng } from "../engine";
import { moveIndex } from "./vocab";

// A legal move and the logit that scores it.
export type Candidate = { move: NormalMove; index: number };

// Every legal move with its place in Maia's output. The move is kept as chessops has it — castling
// as king-takes-rook — and only the index is translated to Maia's board: flipped with the tokens
// when Black is to move, and castling named by where the king lands.
export function candidates(position: Chess): Candidate[] {
	const flip = position.turn === "black" ? 56 : 0;

	return legalMoves(position).map((move) => {
		const side = castlingSide(position, move);
		const to = side === undefined ? move.to : kingCastlesTo(position.turn, side);
		const index = moveIndex({
			from: move.from ^ flip,
			to: to ^ flip,
			promotion: move.promotion,
		});

		return { move, index };
	});
}

// Maia's move, drawn from its softmax over the legal moves — or its likeliest one, for an animal
// that never gambles. One draw every call, greedy or not, so the stream does not depend on which.
export function pickMove({
	candidates: legal,
	logits,
	rng,
	greedy = false,
}: {
	candidates: readonly Candidate[];
	logits: Float32Array;
	rng: Rng;
	greedy?: boolean;
}): NormalMove | undefined {
	const roll = rng.float();
	const scores = legal.map(({ index }) => logits[index] ?? -Infinity);
	const best = Math.max(...scores);
	if (greedy) return legal[scores.indexOf(best)]?.move;

	const weights = scores.map((score) => Math.exp(score - best));
	let left = roll * weights.reduce((sum, weight) => sum + weight, 0);
	for (const [index, weight] of weights.entries()) {
		left -= weight;
		if (left < 0) return legal[index]?.move;
	}

	return legal.at(-1)?.move;
}
