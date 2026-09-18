#include "bitboard.h"
#include "harness.h"

enum { A1 = 0, H1 = 7, E4 = 28, A8 = 56, H8 = 63 };

TEST(numbers_squares_as_chessops_does) {
	CHECK(square_file(H1) == 7 && square_rank(H1) == 0);
	CHECK(square_file(E4) == 4 && square_rank(E4) == 3);
	CHECK(square_bb(H8) == 0x8000000000000000U);
}

TEST(tests_membership_and_counts) {
	Bitboard bb = square_bb(A1) | square_bb(E4);
	CHECK(bb_has(bb, E4) && !bb_has(bb, H1));
	CHECK(bb_count(bb) == 2 && bb_count(~(Bitboard)0) == 64);
	CHECK(bb_many(bb) && !bb_many(square_bb(E4)) && !bb_many(0));
}

TEST(pops_squares_in_ascending_order) {
	Bitboard bb = square_bb(H8) | square_bb(E4) | square_bb(A1);
	CHECK(bb_first(bb) == A1);
	CHECK(bb_pop(&bb) == A1);
	CHECK(bb_pop(&bb) == E4);
	CHECK(bb_pop(&bb) == H8);
	CHECK(bb == 0);
}

TEST(flips_ranks_and_keeps_files) {
	CHECK(bb_flip(square_bb(A1)) == square_bb(A8));
	CHECK(bb_flip(square_bb(E4)) == square_bb(E4 + 8));
	CHECK(bb_flip(bb_flip(0x0123456789abcdefU)) == 0x0123456789abcdefU);
}

TEST(names_the_opposite_colour) { CHECK(opposite(WHITE) == BLACK && opposite(BLACK) == WHITE); }
