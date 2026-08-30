import type { Chess } from "chessops/chess";

import { afterMove, legalCaptures } from "../chess";
import type { PlayedMove } from "../eval";
import { orderMoves } from "./ordering";

export type QuiescenceFrame = { position: Chess; played?: PlayedMove; alpha: number; beta: number };

type Evaluate = (frame: { position: Chess; played?: PlayedMove }) => number;

// Captures only, from a stand-pat baseline: if simply declining to capture already beats the
// window, the opponent would never have allowed the position in the first place.
//
// Without this a search stops wherever its depth runs out, which is often in the middle of a
// trade — it sees itself take the queen and never the recapture. It is the cheapest way to stop a
// shallow bot hanging pieces, and it is optional because a bot deliberately built to hang them
// should be allowed to.
export function createQuiescence({
	evaluate,
	exhausted,
}: {
	evaluate: Evaluate;
	exhausted: () => boolean;
}): (frame: QuiescenceFrame) => number {
	return function quiesce({ position, played, alpha, beta }: QuiescenceFrame): number {
		const standPat = evaluate({ position, played });
		if (standPat >= beta || exhausted()) return standPat;

		let best = Math.max(standPat, alpha);

		for (const move of orderMoves({ position, moves: legalCaptures(position) })) {
			const score = -quiesce({
				position: afterMove({ position, move }),
				played: { parent: position, move },
				alpha: -beta,
				beta: -best,
			});

			if (score >= beta) return score;
			if (score > best) best = score;
		}

		return best;
	};
}
