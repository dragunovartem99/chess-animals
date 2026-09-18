#ifndef ENGINE_EVAL_MASKS_H
#define ENGINE_EVAL_MASKS_H

#include "bitboard.h"

// `families/masks.ts`: the board geometry more than one family reads.
static const Bitboard RANK_1 = 0xffU;

static inline Bitboard rank_bb(int rank) { return RANK_1 << (rank * 8); }
static inline Bitboard back_rank(Color color) { return rank_bb(color == WHITE ? 0 : 7); }

// 0 on the rim, 6 on one of the four central squares.
static inline int centrality(Square square) {
	int file = square_file(square);
	int rank = square_rank(square);
	return (file < 7 - file ? file : 7 - file) + (rank < 7 - rank ? rank : 7 - rank);
}

#endif
