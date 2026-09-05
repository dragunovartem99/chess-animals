import type { Color } from "chessops/types";
import { opposite } from "chessops/util";

import { CLASSICAL_VALUES } from "../../chess";
import { featureId } from "../features";
import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";
import { relativeRank } from "./masks";

const OPPONENT_MOBILITY = featureId("opponentMobility");
const PUSH_DEPTH = featureId("pushDepth");
const OFFERED_MATERIAL = featureId("offeredMaterial");

export const SLOTS = [OPPONENT_MOBILITY, PUSH_DEPTH, OFFERED_MATERIAL];

// Squares a side's pieces can move to, pawn pushes aside. Real legal-move generation would mean
// flipping the side to move, which is not even a legal position when the other king is in check,
// so this counts attacked squares instead — the same approximation mobility makes.
function reachable({ context, color }: { context: EvalContext; color: Color }): number {
	const own = context.position.board[color];
	let total = 0;

	for (const { piece, reach } of context.reach) {
		if (piece.color === color) total += reach.diff(own).size();
	}

	return total;
}

// How far into enemy territory a side has pushed, counting only what has crossed the halfway
// line. Deliberately not the `advancement` feature, which counts every pawn's rank and would give
// the tuner two ways to say a related thing.
function depth({ context, color }: { context: EvalContext; color: Color }): number {
	let total = 0;

	for (const square of context.position.board[color]) {
		total += Math.max(0, relativeRank({ color, square }) - 3);
	}

	return total;
}

// Material a side is leaving to be taken, counted once per way it can be captured — a piece three
// pieces attack is offered three times over. `generous` wants this high, everything else low.
function offered({ context, color }: { context: EvalContext; color: Color }): number {
	const { board } = context.position;
	const enemy = opposite(color);
	let total = 0;

	for (const { piece, reach } of context.reach) {
		if (piece.color !== enemy) continue;

		for (const target of reach.intersect(board[color])) {
			total += CLASSICAL_VALUES[board.getRole(target) ?? "king"];
		}
	}

	return total;
}

// Pressure, in the three flavours the paper found: taking the opponent's moves away, pushing
// everything forward regardless of safety, and handing out material on purpose.
export function extractAggression({
	context,
	features,
}: {
	context: EvalContext;
	features: FeatureVector;
}): void {
	// Three separate walks, so three separate gates — a bot naming one of them has no use for the
	// other two.
	if (context.weighs(OPPONENT_MOBILITY)) {
		features[OPPONENT_MOBILITY] = reachable({ context, color: context.them });
	}

	if (context.weighs(PUSH_DEPTH)) {
		features[PUSH_DEPTH] =
			depth({ context, color: context.us }) - depth({ context, color: context.them });
	}

	if (context.weighs(OFFERED_MATERIAL)) {
		features[OFFERED_MATERIAL] =
			offered({ context, color: context.us }) - offered({ context, color: context.them });
	}
}
