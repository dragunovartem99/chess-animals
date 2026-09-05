import type { Chess } from "chessops/chess";
import { opposite } from "chessops/util";

import { repetitionKey } from "./position";
import type { Repetition } from "./repetition";
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

// Nothing is drawn for want of material while a pawn, a rook or a queen is still on the board, so
// three emptiness tests stand in front of `isInsufficientMaterial`, which is a dozen more. This
// runs at every node of every search, and in almost all of them the first test is the last.
function couldBeInsufficient(position: Chess): boolean {
	const { board } = position;

	return board.pawn.isEmpty() && board.rook.isEmpty() && board.queen.isEmpty();
}

// The draws a *search* has to see for itself, as opposed to `gameStatus`, which adjudicates a
// game that has already been played.
//
// Mate and stalemate are not here: they belong to `terminalScore`, because a bot is allowed an
// opinion about them — `givesMate` is a preference, and a bot that cannot see mate evaluates a
// mated position like any other. A draw is not a preference. A position the game cannot continue
// from is worth zero to whoever stands in it, and that single fact is what stops a winning bot
// shuffling into a repetition and lets a losing one steer for the only half point on offer.
//
// Zero rather than a tunable contempt, because every feature is already a difference between the
// sides: a level position scores near zero, so zero is the honest price of splitting the point.
// Bound to one line's history and then asked about a position, rather than taking both together:
// this is called at every node of every search, and an argument object per node cost more than
// the four tests inside it.
export function createDrawTest(repetition: Repetition): (position: Chess) => boolean {
	return function drawn(position: Chess): boolean {
		// Mate on the hundredth half-move is mate, not a draw — the same order `gameStatus` takes.
		// The test costs nothing anywhere else, because nothing else gets this far.
		if (position.halfmoves >= FIFTY_MOVE_HALFMOVES) return !position.isCheckmate();

		if (couldBeInsufficient(position) && position.isInsufficientMaterial()) return true;

		// One repetition, not the rule's three. The third copy is the draw, but a bot that walks
		// into the second has already agreed to the line that makes it — and a search that waited
		// for the third would need six more plies than any animal here has.
		return repetition.repeats(position);
	};
}
