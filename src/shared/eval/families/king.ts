import { kingAttacks } from "chessops/attacks";
import { SquareSet } from "chessops/squareSet";
import type { Color, Role } from "chessops/types";
import { opposite } from "chessops/util";

import { featureId } from "../features";
import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";

const KING_ATTACKERS = featureId("kingAttackers");

export const SLOTS = [KING_ATTACKERS];

// What a piece is worth as an attacker near the king — not what it is worth on the board. A queen
// arriving next to the king is the whole attack; a pawn is a nuisance.
const ATTACK_VALUE: Partial<Record<Role, number>> = {
	pawn: 1,
	knight: 2,
	bishop: 2,
	rook: 3,
	queen: 5,
};

function ringOf({ king }: { king: number }): SquareSet {
	return kingAttacks(king).with(king);
}

function attackersOn({ context, color }: { context: EvalContext; color: Color }): number {
	const king = context.position.board.kingOf(color);
	if (king === undefined) return 0;

	const ring = ringOf({ king });
	const enemy = opposite(color);

	let attackers = 0;

	for (const { piece, reach } of context.reach) {
		if (piece.role === "king" || piece.color !== enemy || !reach.intersects(ring)) continue;

		attackers += ATTACK_VALUE[piece.role] ?? 0;
	}

	return attackers;
}

// Pressure around the king, ours minus theirs. A `kingPawnDistance` term sat beside this one and
// was cut: no animal ever weighed it, the lab rated it +30 against bare material — inside the
// ±35 noise band — and it cost a walk of every pawn on the board per node to say it.
export function extractKing({
	context,
	features,
}: {
	context: EvalContext;
	features: FeatureVector;
}): void {
	features[KING_ATTACKERS] =
		attackersOn({ context, color: context.us }) - attackersOn({ context, color: context.them });
}
