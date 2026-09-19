import type { Chess } from "chessops/chess";
import { opposite } from "chessops/util";

import { repetitionKey } from "./position";
import type { GameStatus } from "./types";

// Threefold: the position on the board counts as one of the three.
const REPETITION_LIMIT = 3;

// Half-moves without a capture or pawn move before the game is drawn.
const FIFTY_MOVE_HALFMOVES = 100;

function countRepetitions({ key, keys }: { key: string; keys: readonly string[] }): number {
	let seen = 0;
	for (const previous of keys) {
		if (previous === key) seen += 1;
	}
	return seen;
}

// Whether the game is over, and why. `keys` holds the repetition key of every position that came
// *before* the one on the board; the current position is counted on top of them. chessops decides
// mate and material on its own, but repetition and the ply cap need the history only the caller
// has.
export function gameStatus({
	position,
	keys = [],
	plyLimit,
	ply = 0,
}: {
	position: Chess;
	keys?: readonly string[];
	plyLimit?: number;
	ply?: number;
}): GameStatus {
	if (position.isCheckmate()) {
		return { over: true, result: opposite(position.turn), reason: "checkmate" };
	}

	if (position.isStalemate()) return { over: true, result: null, reason: "stalemate" };

	if (position.isInsufficientMaterial()) {
		return { over: true, result: null, reason: "insufficient-material" };
	}

	if (countRepetitions({ key: repetitionKey(position), keys }) + 1 >= REPETITION_LIMIT) {
		return { over: true, result: null, reason: "repetition" };
	}

	if (position.halfmoves >= FIFTY_MOVE_HALFMOVES) {
		return { over: true, result: null, reason: "fifty-move" };
	}

	// The cap is an adjudication, not a chess rule: it stops two aimless bots from shuffling
	// forever and costing the arena a worker slot.
	if (plyLimit !== undefined && ply >= plyLimit) {
		return { over: true, result: null, reason: "ply-limit" };
	}

	return { over: false };
}
