import { attacks, kingAttacks } from "chessops/attacks";
import { SquareSet } from "chessops/squareSet";
import type { Color, Role } from "chessops/types";
import { opposite, squareFile } from "chessops/util";

import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";
import { KING_SLOTS, type KingCounts } from "./kingSlots";
import { chebyshev, FILES } from "./masks";

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

function countFor({ context, color }: { context: EvalContext; color: Color }): KingCounts {
	const { board } = context.position;
	const king = board.kingOf(color);
	if (king === undefined) return { attackers: 0, defenders: 0, openFiles: 0, pawnDistance: 0 };

	const ring = ringOf({ king });
	const enemy = opposite(color);

	let attackers = 0;
	let defenders = 0;

	for (const [square, piece] of board) {
		if (piece.role === "king") continue;

		const reach = attacks(piece, square, board.occupied);
		if (!reach.intersects(ring)) continue;

		if (piece.color === enemy) attackers += ATTACK_VALUE[piece.role] ?? 0;
		else defenders += 1;
	}

	const pawns = board.pieces(color, "pawn");
	const file = squareFile(king);

	// The king's own file and its neighbours: a file with none of his pawns left on it is a road
	// straight to him, whatever else is in the way.
	let openFiles = 0;
	for (const candidate of [file - 1, file, file + 1]) {
		if (candidate >= 0 && candidate <= 7 && !pawns.intersects(FILES[candidate])) openFiles += 1;
	}

	let pawnDistance = 0;
	if (pawns.nonEmpty()) {
		pawnDistance = Math.min(...[...pawns].map((pawn) => chebyshev({ from: king, to: pawn })));
	}

	return { attackers, defenders, openFiles, pawnDistance };
}

export function extractKing({
	context,
	features,
}: {
	context: EvalContext;
	features: FeatureVector;
}): void {
	const ours = countFor({ context, color: context.us });
	const theirs = countFor({ context, color: context.them });

	for (const [key, slot] of KING_SLOTS) features[slot] = ours[key] - theirs[key];
}
