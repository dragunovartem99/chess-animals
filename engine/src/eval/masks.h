#ifndef ENGINE_EVAL_MASKS_H
#define ENGINE_EVAL_MASKS_H

#include "bitboard.h"

// `families/masks.ts`: the board geometry more than one family reads.
static const Bitboard FILE_A = 0x0101010101010101U;
static const Bitboard RANK_1 = 0xffU;

static inline Bitboard file_bb(int file) { return FILE_A << file; }
static inline Bitboard rank_bb(int rank) { return RANK_1 << (rank * 8); }
static inline Bitboard back_rank(Color color) { return rank_bb(color == WHITE ? 0 : 7); }

// 0 on the rim, 6 on one of the four central squares.
static inline int centrality(Square square) {
	int file = square_file(square);
	int rank = square_rank(square);
	return (file < 7 - file ? file : 7 - file) + (rank < 7 - rank ? rank : 7 - rank);
}

// The rank a square sits on, counted from `color`'s own back rank.
static inline int relative_rank(Color color, Square square) {
	return color == WHITE ? square_rank(square) : 7 - square_rank(square);
}

// Everything strictly ahead of a pawn on its own and both neighbouring files: empty of enemy
// pawns is what makes it passed. A pawn never stands on its last rank, so no shift reaches 64.
static inline Bitboard passed_span(Color color, Square square) {
	int file = square_file(square);
	int rank = square_rank(square);
	Bitboard ahead =
	    color == WHITE ? ~(Bitboard)0 << ((rank + 1) * 8) : ((Bitboard)1 << (rank * 8)) - 1;
	Bitboard files =
	    file_bb(file) | (file > 0 ? file_bb(file - 1) : 0) | (file < 7 ? file_bb(file + 1) : 0);
	return ahead & files;
}

// King-move distance: the steps a king needs between two squares.
static inline int chebyshev(Square from, Square to) {
	int files = square_file(from) - square_file(to);
	int ranks = square_rank(from) - square_rank(to);
	files = files < 0 ? -files : files;
	ranks = ranks < 0 ? -ranks : ranks;
	return files > ranks ? files : ranks;
}

#endif
