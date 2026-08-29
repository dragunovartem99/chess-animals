import { SquareSet } from "chessops/squareSet";
import type { Color } from "chessops/types";
import { opposite } from "chessops/util";

import { featureId } from "../features";
import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";

const CENTER_CONTROL = featureId("centerControl");
const SPACE = featureId("space");
const HANGING = featureId("hanging");

const CENTER = SquareSet.center();

// The four ranks on the far side of the board, from `color`'s point of view.
function enemyHalf(color: Color): SquareSet {
	let half = SquareSet.empty();

	for (const rank of color === "white" ? [4, 5, 6, 7] : [0, 1, 2, 3]) {
		half = half.union(SquareSet.fromRank(rank));
	}

	return half;
}

const ENEMY_HALF = { white: enemyHalf("white"), black: enemyHalf("black") };

// Pieces of `color` that the other side attacks and `color` does not defend. The king is left
// out: it can never simply be taken, and it is always "attacked" in check.
function countHanging({ context, color }: { context: EvalContext; color: Color }): number {
	const { board } = context.position;
	const exposed = board[color]
		.diff(board.king)
		.intersect(context.attacksBy[opposite(color)])
		.diff(context.attacksBy[color]);

	return exposed.size();
}

// Who holds the middle, who has room, and who has left something en prise. Like every feature,
// each is ours minus theirs; whether more of it is good is the weight's business, which is why
// `hanging` defaults to a negative one.
export function extractControl({
	context,
	features,
}: {
	context: EvalContext;
	features: FeatureVector;
}): void {
	const { us, them, attacksBy } = context;

	features[CENTER_CONTROL] =
		attacksBy[us].intersect(CENTER).size() - attacksBy[them].intersect(CENTER).size();

	features[SPACE] =
		attacksBy[us].intersect(ENEMY_HALF[us]).size() -
		attacksBy[them].intersect(ENEMY_HALF[them]).size();

	features[HANGING] =
		countHanging({ context, color: us }) - countHanging({ context, color: them });
}
