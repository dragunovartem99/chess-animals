import type { Key } from "chessground/types";
import { parseSquare } from "chessops/util";

import { positionFromFen } from "@/shared/chess";

// A pawn arriving on the far rank is the one move chessground cannot resolve on its own: four
// legal moves share the same two squares, and only the player knows which was meant.
export function isPromotionMove({ fen, from, to }: { fen: string; from: Key; to: Key }): boolean {
	const position = positionFromFen(fen);
	const square = parseSquare(from);
	if (square === undefined) return false;

	const lastRank = position.turn === "white" ? "8" : "1";

	return position.board.getRole(square) === "pawn" && to.endsWith(lastRank);
}
