import type { Chess } from "chessops/chess";

// The words a repetition claim is made on: where every man stands, who is to move, what may still
// castle, and where en passant is available. The move counters are deliberately absent — two
// positions repeat regardless of how the clocks got there.
//
// `black` is not among them because it is implied: the six role sets give the occupied squares,
// and `white` splits them.
const WORD_COUNT = 18;

// Filled and drained inside one call, so the recursion never sees a half-written buffer — the
// same argument that lets move ordering keep one priority array. Reused rather than allocated
// because this runs at nodes the search reaches by the thousand.
const scratch = new Int32Array(WORD_COUNT);

// A 64-bit identity for a position, written into `words` at `at` as two halves.
//
// Two halves rather than one: a collision here scores a live position as a draw, which at 32 bits
// an arena of millions of nodes would hit repeatedly and at 64 never. chessops ships no Zobrist
// key and there is nothing to update incrementally, so this is a full re-mix of the position —
// which is why the caller only asks for it once `halfmoves` says a repetition is possible at all.
//
// `repetitionKey` answers the same question exactly, as a FEN, and stays the game-level rule's —
// it is also the openings' identity. A string per node is what this exists to avoid.
export function hashInto({
	position,
	words,
	at,
}: {
	position: Chess;
	words: Int32Array;
	at: number;
}): void {
	const { board } = position;

	scratch[0] = board.white.lo;
	scratch[1] = board.white.hi;
	scratch[2] = board.pawn.lo;
	scratch[3] = board.pawn.hi;
	scratch[4] = board.knight.lo;
	scratch[5] = board.knight.hi;
	scratch[6] = board.bishop.lo;
	scratch[7] = board.bishop.hi;
	scratch[8] = board.rook.lo;
	scratch[9] = board.rook.hi;
	scratch[10] = board.queen.lo;
	scratch[11] = board.queen.hi;
	scratch[12] = board.king.lo;
	scratch[13] = board.king.hi;
	scratch[14] = position.castles.castlingRights.lo;
	scratch[15] = position.castles.castlingRights.hi;
	// 64 stands for "no en passant", which is not a square.
	scratch[16] = position.epSquare ?? 64;
	scratch[17] = position.turn === "white" ? 1 : 2;

	let low = 0x2545f491;
	let high = 0x9e3779b9;

	for (let index = 0; index < WORD_COUNT; index += 1) {
		const word = scratch[index];

		low = Math.imul(low ^ word, 0x85ebca6b);
		low ^= low >>> 13;
		high = Math.imul(high ^ word, 0xc2b2ae35);
		high ^= high >>> 16;
	}

	words[at] = low;
	words[at + 1] = high;
}
