#ifndef ENGINE_BOARD_PIECES_H
#define ENGINE_BOARD_PIECES_H

#include "bitboard.h"
#include "position.h"
#include "zobrist.h"

// The only writes to the board: the bitboards, the mailbox and the hash change together here and
// nowhere else, so none of them can fall out of step with the others.
static inline void put_piece(Position *pos, Square square, Piece piece) {
	pos->colors[piece_color(piece)] |= square_bb(square);
	pos->roles[piece_role(piece)] |= square_bb(square);
	pos->board[square] = piece;
	pos->hash ^= zobrist_pieces[piece][square];
}

static inline Piece take_piece(Position *pos, Square square) {
	Piece piece = pos->board[square];
	pos->colors[piece_color(piece)] &= ~square_bb(square);
	pos->roles[piece_role(piece)] &= ~square_bb(square);
	pos->board[square] = PIECE_NONE;
	pos->hash ^= zobrist_pieces[piece][square];
	return piece;
}

#endif
