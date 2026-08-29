import { attacks } from "chessops/attacks";
import type { Color, Role } from "chessops/types";
import { opposite } from "chessops/util";

import { featureId } from "../features";
import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";
import { relativeRank } from "./masks";

const OPPONENT_MOBILITY = featureId("opponentMobility");
const PUSH_DEPTH = featureId("pushDepth");
const OFFERED_MATERIAL = featureId("offeredMaterial");

// The paper's own values, used only to price what is being offered — the tunable piece values
// live in the material family and would make this feature move when they did.
const OFFER_VALUE: Record<Role, number> = {
	pawn: 1,
	knight: 3,
	bishop: 3,
	rook: 5,
	queen: 9,
	king: 0,
};

// Squares a side's pieces can move to, pawn pushes aside. Real legal-move generation would mean
// flipping the side to move, which is not even a legal position when the other king is in check,
// so this counts attacked squares instead — the same approximation mobility makes.
function reachable({ context, color }: { context: EvalContext; color: Color }): number {
	const { board } = context.position;
	let total = 0;

	for (const [square, piece] of board) {
		if (piece.color !== color) continue;

		total += attacks(piece, square, board.occupied).diff(board[color]).size();
	}

	return total;
}

// How far into enemy territory a side has pushed, counting only what has crossed the halfway
// line. Deliberately not the sum of the per-role advancement features, which would give the tuner
// two ways to say the same thing.
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
	let total = 0;

	for (const [square, piece] of board) {
		if (piece.color !== opposite(color)) continue;

		for (const target of attacks(piece, square, board.occupied).intersect(board[color])) {
			total += OFFER_VALUE[board.getRole(target) ?? "king"];
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
	features[OPPONENT_MOBILITY] = reachable({ context, color: context.them });
	features[PUSH_DEPTH] =
		depth({ context, color: context.us }) - depth({ context, color: context.them });
	features[OFFERED_MATERIAL] =
		offered({ context, color: context.us }) - offered({ context, color: context.them });
}
