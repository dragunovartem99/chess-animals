#include "attacks.h"
#include "bitboard.h"
#include "tables.h"

Bitboard knight_table[SQUARE_COUNT];
Bitboard king_table[SQUARE_COUNT];
Bitboard pawn_table[COLOR_COUNT][SQUARE_COUNT];

static const Step KNIGHT_STEPS[] = {{1, 2},   {2, 1},   {2, -1}, {1, -2},
                                    {-1, -2}, {-2, -1}, {-2, 1}, {-1, 2}};
static const Step KING_STEPS[] = {{1, 0},  {1, 1},   {0, 1},  {-1, 1},
                                  {-1, 0}, {-1, -1}, {0, -1}, {1, -1}};
static const Step WHITE_PAWN_STEPS[] = {{-1, 1}, {1, 1}};
static const Step BLACK_PAWN_STEPS[] = {{-1, -1}, {1, -1}};

// Every square one step away, the steps that would leave the board dropped.
static Bitboard leaps(Square square, const Step *steps, int count) {
	Bitboard bb = 0;
	for (int index = 0; index < count; index++) {
		bb |= step_bb(square, steps[index]);
	}
	return bb;
}

void leapers_init(void) {
	for (int index = 0; index < SQUARE_COUNT; index++) {
		Square square = (Square)index;
		knight_table[square] = leaps(square, KNIGHT_STEPS, 8);
		king_table[square] = leaps(square, KING_STEPS, 8);
		pawn_table[WHITE][square] = leaps(square, WHITE_PAWN_STEPS, 2);
		pawn_table[BLACK][square] = leaps(square, BLACK_PAWN_STEPS, 2);
	}
}
