#ifndef ENGINE_MOVEGEN_MOVEGEN_H
#define ENGINE_MOVEGEN_MOVEGEN_H

#include "bitboard.h"

// A step in files and ranks — how the tables are built, never how they are read.
typedef struct {
	int file;
	int rank;
} Step;

// The square one step away as a set, or the empty set when the step leaves the board.
static inline Bitboard step_bb(Square square, Step step) {
	int file = square_file(square) + step.file;
	int rank = square_rank(square) + step.rank;
	return file >= 0 && file < 8 && rank >= 0 && rank < 8 ? square_bb((Square)(rank * 8 + file))
	                                                      : 0;
}

void leapers_init(void);
void magics_init(void);

#endif
