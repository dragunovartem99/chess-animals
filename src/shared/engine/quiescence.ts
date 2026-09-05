import type { Chess } from "chessops/chess";

import { type Descend, legalCaptures, legalMoves } from "../chess";
import type { PlayedMove } from "../eval";
import { orderMoves } from "./ordering";

export type QuiescenceFrame = {
	position: Chess;
	played?: PlayedMove;
	ply: number;
	alpha: number;
	beta: number;
};

type Evaluate = (frame: { position: Chess; played?: PlayedMove; ply: number }) => number;

// How many times one line may stop to answer a check before the extension gives up and stands pat
// again. Unbounded, a checking sequence is a hole in the bottom of the search: the move list stops
// shrinking, and the quiescence benchmark ran 2.5× slower for tactics no depth-2 animal follows
// up. One is enough for the case the extension is for — the leaf the search happens to stop on.
const EVASION_BUDGET = 1;

// Captures, from a stand-pat baseline: if simply declining to capture already beats the window,
// the opponent would never have allowed the position in the first place.
//
// Without this a search stops wherever its depth runs out, which is often in the middle of a
// trade — it sees itself take the queen and never the recapture. It is the cheapest way to stop a
// shallow bot hanging pieces, and it is optional because a bot deliberately built to hang them
// should be allowed to.
//
// Check is the one position where every move is searched, not only the captures: the side to move
// cannot decline, so the baseline is a fiction and a bot with no capturing escape would otherwise
// score the position as if it could just stay in check. The recursion still terminates, because
// an evasion is answered by captures only — every second ply removes a piece.
//
// Quiet moves that *give* check are deliberately not searched. They are the other half of what
// "quiescence with checks" usually means, and they cost far more than they are worth here: the
// move list stops shrinking, so the tree grows several times over to buy tactics a depth-2 animal
// was never going to follow up on anyway.
export function createQuiescence({
	descend,
	evaluate,
	exhausted,
}: {
	descend: Descend;
	evaluate: Evaluate;
	exhausted: () => boolean;
}): (frame: QuiescenceFrame) => number {
	function quiesce(
		{ position, played, ply, alpha, beta }: QuiescenceFrame,
		budget: number
	): number {
		const inCheck = budget > 0 && position.isCheck();
		const standPat = evaluate({ position, played, ply });

		// Standing pat is only on offer when the side to move may decline: in check it must
		// answer, so the baseline is dropped and the score comes from the evasions alone. Both
		// cutoffs come before the move list, which neither of them needs.
		if (exhausted() || (!inCheck && standPat >= beta)) return standPat;

		const moves = inCheck ? legalMoves(position) : legalCaptures(position);

		// No move at all means mate, and `standPat` is what recognises it. Out of check it means
		// the position is already quiet, which is what the whole search is looking for.
		if (moves.length === 0) return standPat;

		let best = inCheck ? -Infinity : Math.max(standPat, alpha);

		for (const move of orderMoves({ position, moves })) {
			const score = -quiesce(
				{
					position: descend({ position, move, ply: ply + 1 }),
					played: { parent: position, move },
					ply: ply + 1,
					alpha: -beta,
					beta: -best,
				},
				inCheck ? budget - 1 : budget
			);

			if (score >= beta) return score;
			if (score > best) best = score;
		}

		return best;
	}

	return (frame: QuiescenceFrame) => quiesce(frame, EVASION_BUDGET);
}
