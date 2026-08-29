import type { Color } from "chessops/types";
import { opposite, squareFile, squareRank } from "chessops/util";

import { featureId } from "../features";
import type { FeatureVector } from "../vector";
import type { EvalContext } from "./context";
import { FILES } from "./masks";

const BISHOP_PAIR = featureId("bishopPair");
const ROOK_OPEN_FILE = featureId("rookOpenFile");
const ROOK_SEVENTH = featureId("rookSeventh");
const KNIGHT_OUTPOST = featureId("knightOutpost");

// The rank a rook wants, counted from its own side: 6 for White, 1 for Black.
function seventhRank(color: Color): number {
	return color === "white" ? 6 : 1;
}

// A knight is on an outpost when its own pawn defends it and no enemy pawn can ever come to
// challenge it — no enemy pawn is left on either neighbouring file, ahead of the knight.
function isOutpost({
	context,
	square,
	color,
}: {
	context: EvalContext;
	square: number;
	color: Color;
}): boolean {
	if (!context.pawnAttacks[color].has(square)) return false;

	const file = squareFile(square);
	const rank = squareRank(square);
	const enemyPawns = context.position.board.pieces(opposite(color), "pawn");

	for (const neighbour of [file - 1, file + 1]) {
		if (neighbour < 0 || neighbour > 7) continue;

		for (const pawn of enemyPawns.intersect(FILES[neighbour])) {
			const ahead = color === "white" ? squareRank(pawn) > rank : squareRank(pawn) < rank;
			if (ahead) return false;
		}
	}

	return true;
}

function countFor({ context, color }: { context: EvalContext; color: Color }): number[] {
	const { board } = context.position;
	const pawns = board.pawn;

	const bishops = board.pieces(color, "bishop");
	const rooks = board.pieces(color, "rook");

	let openFiles = 0;
	for (const square of rooks) {
		if (!pawns.intersects(FILES[squareFile(square)])) openFiles += 1;
	}

	let seventh = 0;
	for (const square of rooks) {
		if (squareRank(square) === seventhRank(color)) seventh += 1;
	}

	let outposts = 0;
	for (const square of board.pieces(color, "knight")) {
		if (isOutpost({ context, square, color })) outposts += 1;
	}

	return [bishops.size() >= 2 ? 1 : 0, openFiles, seventh, outposts];
}

const SLOTS = [BISHOP_PAIR, ROOK_OPEN_FILE, ROOK_SEVENTH, KNIGHT_OUTPOST];

export function extractPieces({
	context,
	features,
}: {
	context: EvalContext;
	features: FeatureVector;
}): void {
	const ours = countFor({ context, color: context.us });
	const theirs = countFor({ context, color: context.them });

	for (const [index, slot] of SLOTS.entries()) features[slot] = ours[index] - theirs[index];
}
