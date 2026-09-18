#include <stdbool.h>
#include <stdint.h>

#include "bitboard.h"
#include "draw.h"
#include "move.h"
#include "movegen.h"
#include "position.h"

// A position cannot return in fewer plies: the side that moved cannot undo it at once, and an
// odd gap has the other side to move.
enum { MIN_REPETITION_PLIES = 4, FIFTY_MOVE_HALFMOVES = 100 };

static const Bitboard DARK_SQUARES = 0xaa55aa55aa55aa55U;

bool history_repeats(const History *history, const Position *pos) {
	// Nothing before the last capture or pawn move can come back, so `halfmoves` bounds the scan
	// and most nodes never enter it. Every entry in reach is compared, not every second: the side
	// to move is in the hash, so an entry at the wrong parity cannot match anyway.
	unsigned back = pos->halfmoves < history->length ? pos->halfmoves : history->length;
	back = back < HISTORY_SIZE ? back : HISTORY_SIZE;
	if (back < MIN_REPETITION_PLIES) {
		return false;
	}
	for (unsigned index = history->length - back; index < history->length; index++) {
		if (history->hashes[index & (HISTORY_SIZE - 1)] == pos->hash) {
			return true;
		}
	}
	return false;
}

// chessops's `hasInsufficientMaterial`, rule for rule, including its reading of a lone knight
// against queens and of bishops that must all share one square colour.
static bool cannot_mate(const Position *pos, Color color) {
	Bitboard ours = pos->colors[color];
	if ((ours & (pos->roles[PAWN] | pos->roles[ROOK] | pos->roles[QUEEN])) != 0) {
		return false;
	}
	if ((ours & pos->roles[KNIGHT]) != 0) {
		Bitboard theirs = pos->colors[opposite(color)] & ~(pos->roles[KING] | pos->roles[QUEEN]);
		return bb_count(ours) <= 2 && theirs == 0;
	}
	if ((ours & pos->roles[BISHOP]) != 0) {
		Bitboard bishops = pos->roles[BISHOP];
		bool same_colour = (bishops & DARK_SQUARES) == 0 || (bishops & ~DARK_SQUARES) == 0;
		return same_colour && pos->roles[PAWN] == 0 && pos->roles[KNIGHT] == 0;
	}
	return true;
}

bool insufficient_material(const Position *pos) {
	return cannot_mate(pos, WHITE) && cannot_mate(pos, BLACK);
}

bool position_drawn(const Position *pos, const History *history) {
	// Mate on the hundredth half-move is mate, not a draw — the order `gameStatus` takes too.
	if (pos->halfmoves >= FIFTY_MOVE_HALFMOVES) {
		Move moves[MAX_MOVES];
		return move_context(pos).checkers == 0 || generate_moves(pos, moves) > 0;
	}
	return insufficient_material(pos) || history_repeats(history, pos);
}
