#include <stdint.h>

#include "attacks.h"
#include "bitboard.h"
#include "movegen.h"
#include "position.h"

// chessops's `castlingDest` for one side: the squares both men cross must be empty, the king must
// cross no attacked square, and must not land on one with the rook already moved.
static Bitboard castling_dest(const Position *pos, const MoveContext *ctx, uint8_t right,
                              int rook_file) {
	if ((pos->castling & right) == 0) {
		return 0;
	}
	Color them = opposite(pos->turn);
	Square king = ctx->king;
	Square rook = (Square)(king - 4 + rook_file);
	Square king_to = (Square)(rook_file == 7 ? king + 2 : king - 2);
	Square rook_to = (Square)(rook_file == 7 ? king + 1 : king - 1);
	Bitboard occupied = pos->colors[WHITE] | pos->colors[BLACK];
	Bitboard path = (between(rook, rook_to) | square_bb(rook_to) | between(king, king_to) |
	                 square_bb(king_to)) &
	                ~(square_bb(king) | square_bb(rook));
	if ((path & occupied) != 0) {
		return 0;
	}
	for (Bitboard crossed = between(king, king_to); crossed != 0;) {
		if (attackers_to(pos, bb_pop(&crossed), them, occupied ^ square_bb(king)) != 0) {
			return 0;
		}
	}
	Bitboard after = occupied ^ square_bb(king) ^ square_bb(rook) ^ square_bb(rook_to);
	return attackers_to(pos, king_to, them, after) == 0 ? square_bb(rook) : 0;
}

Bitboard castling_dests(const Position *pos, const MoveContext *ctx) {
	if (ctx->checkers != 0) {
		return 0;
	}
	bool white = pos->turn == WHITE;
	return castling_dest(pos, ctx, white ? CASTLE_WHITE_A : CASTLE_BLACK_A, 0) |
	       castling_dest(pos, ctx, white ? CASTLE_WHITE_H : CASTLE_BLACK_H, 7);
}
