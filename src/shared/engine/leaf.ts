import type { Chess } from "chessops/chess";

import type { Descend } from "../chess";
import type { PlayedMove, WeightVector } from "../eval";
import { createEvaluator } from "./evaluate";
import { createQuiescence } from "./quiescence";

// What scoring one position needs. The window is only quiescence's business, so the plain
// evaluation asks for less than the extension does.
export type ScoreFrame = { position: Chess; played?: PlayedMove; ply: number };

export type LeafFrame = ScoreFrame & { alpha: number; beta: number };

export type Leaf = {
	// Where the search stops descending: quiescence when the bot asked for it, the evaluation
	// otherwise.
	score: (frame: LeafFrame) => number;
	// The evaluation alone, for the one node that must not be extended — a position with no legal
	// moves, which is over however quiet it looks.
	evaluate: (frame: ScoreFrame) => number;
	exhausted: () => boolean;
};

// Everything the search does once it stops going deeper, and the budget that says when that is.
//
// The counter lives here because this is what spends it: the recursion above never scores a
// position itself, so a node is exactly one visit through this. Reaching the limit does not
// corrupt a result — it only stops the search extending, and the evaluation already in hand
// stands.
export function createLeaf({
	weights,
	quiescence,
	nodeLimit,
	descend,
	drawn,
	drawScore,
}: {
	weights: WeightVector;
	quiescence: boolean;
	nodeLimit: number;
	descend: Descend;
	drawn: (position: Chess) => boolean;
	drawScore: number;
}): Leaf {
	const scorePosition = createEvaluator({ weights });
	let nodes = 0;

	const evaluate = (frame: ScoreFrame) => {
		nodes += 1;
		return scorePosition(frame);
	};

	const exhausted = () => nodes >= nodeLimit;
	const quiesce = createQuiescence({ descend, drawn, drawScore, evaluate, exhausted });

	return {
		score: (frame) => (quiescence ? quiesce(frame) : evaluate(frame)),
		evaluate,
		exhausted,
	};
}
