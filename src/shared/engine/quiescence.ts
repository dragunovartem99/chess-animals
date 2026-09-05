import type { Chess } from "chessops/chess";
import type { Role } from "chessops/types";

import { type Descend, legalCaptures, legalMoves } from "../chess";
import type { PlayedMove } from "../eval";
import { DELTA_MARGIN } from "./delta";
import { orderMoves } from "./ordering";

export type QuiescenceFrame = {
	position: Chess;
	played?: PlayedMove;
	ply: number;
	alpha: number;
	beta: number;
};

type Evaluate = (frame: {
	position: Chess;
	played?: PlayedMove;
	ply: number;
	inCheck?: boolean;
}) => number;

// What the extension holds for a whole search, alongside the budget the current line has left.
// Carried in the frame rather than closed over for the same reason as negamax's: the frame is
// allocated per node regardless, and this keeps the recursion a plain function.
type Deps = {
	descend: Descend;
	drawn: (position: Chess) => boolean;
	drawScore: number;
	evaluate: Evaluate;
	exhausted: () => boolean;
	// The most this bot can win by taking a piece of each role. See `captureWorth`.
	worth: Record<Role, number>;
};

type Descent = QuiescenceFrame & { deps: Deps; budget: number };

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
// A capture is irreversible, so these lines almost never reach a repetition — but they do run the
// clock into the fifty-move rule and take the last pieces off the board, so `drawn` is asked here
// too: a bot that traded into a dead draw must not be told it stood a queen up.
//
// Quiet moves that *give* check are deliberately not searched. They are the other half of what
// "quiescence with checks" usually means, and they cost far more than they are worth here: the
// move list stops shrinking, so the tree grows several times over to buy tactics a depth-2 animal
// was never going to follow up on anyway.
// Delta pruning: a capture that could not lift the standing score to `alpha` even if the piece
// were free is not searched. Down a rook, there is no point looking at what happens after taking a
// pawn — the reply does not matter, because the pawn was never going to be enough.
//
// A promotion is never pruned: it wins a queen on top of whatever it takes, which is not what
// `worth` measures. Nor is anything while in check, where there is no standing score to add to.
function hopeless({
	standPat,
	alpha,
	worth,
}: {
	standPat: number;
	alpha: number;
	worth: number;
}): boolean {
	return standPat + worth + DELTA_MARGIN <= alpha;
}

export function createQuiescence(deps: Deps): (frame: QuiescenceFrame) => number {
	return (frame: QuiescenceFrame) => quiesce({ ...frame, deps, budget: EVASION_BUDGET });
}

function quiesce({ deps, budget, position, played, ply, alpha, beta }: Descent): number {
	const { descend, drawn, drawScore, evaluate, exhausted, worth } = deps;

	if (drawn(position)) return drawScore;

	// One `isCheck` for the node: `checked` is the position's own state, `inCheck` is that gated by
	// the evasion budget. Handing `checked` to `evaluate` lets `terminalScore` skip a mate/stalemate
	// probe that the check state already answers.
	const checked = position.isCheck();
	const inCheck = budget > 0 && checked;
	const standPat = evaluate({ position, played, ply, inCheck: checked });

	// Standing pat is only on offer when the side to move may decline: in check it must answer, so
	// the baseline is dropped and the score comes from the evasions alone. Both cutoffs come
	// before the move list, which neither of them needs.
	if (exhausted() || (!inCheck && standPat >= beta)) return standPat;

	const moves = inCheck ? legalMoves(position) : legalCaptures(position);

	// No move at all means mate, and `standPat` is what recognises it. Out of check it means the
	// position is already quiet, which is what the whole search is looking for.
	if (moves.length === 0) return standPat;

	let best = inCheck ? -Infinity : Math.max(standPat, alpha);

	for (const move of orderMoves({ position, moves })) {
		const victim = inCheck || move.promotion ? undefined : position.board.getRole(move.to);
		if (victim && hopeless({ standPat, alpha, worth: worth[victim] })) continue;

		const score = -quiesce({
			deps,
			budget: inCheck ? budget - 1 : budget,
			position: descend({ position, move, ply: ply + 1 }),
			played: { parent: position, move },
			ply: ply + 1,
			alpha: -beta,
			beta: -best,
		});

		if (score >= beta) return score;
		if (score > best) best = score;
	}

	return best;
}
