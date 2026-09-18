#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "attacks.h"
#include "bitboard.h"
#include "harness.h"
#include "position.h"
#include "rng.h"

static Piece piece_named(char name) {
	static const char NAMES[] = "PNBRQK";
	const char *found = strchr(NAMES, name == 'p' ? 'P' : name);
	Color color = name == 'p' ? BLACK : WHITE;
	return found == NULL ? PIECE_NONE : make_piece(color, (Role)(found - NAMES));
}

// Each line of `fixtures/attacks.txt` is what chessops's `attacks` returned: piece, square,
// occupancy, attacks.
TEST(equals_chessops_attacks_on_the_fixture) {
	FILE *file = fopen("tests/fixtures/attacks.txt", "r");
	CHECK(file != NULL);
	int count = 0;
	char line[64];
	while (file != NULL && fgets(line, sizeof line, file) != NULL) {
		char *at = line + 2;
		Piece piece = piece_named(line[0]);
		unsigned long square = strtoul(at, &at, 10);
		Bitboard occupied = strtoull(at, &at, 16);
		Bitboard expected = strtoull(at, &at, 16);
		CHECK(piece != PIECE_NONE && square < SQUARE_COUNT &&
		      piece_attacks(piece, (Square)square, occupied) == expected);
		count++;
	}
	CHECK(count == 7 * 64 + 3 * 64 * 7);
	(void)(file != NULL && fclose(file));
}

// The slow walk the magics replace, written again here so the check does not share code with it.
static Bitboard walk(Square square, Bitboard occupied, const int rays[4][2]) {
	Bitboard bb = 0;
	for (int ray = 0; ray < 4; ray++) {
		int file = square_file(square) + rays[ray][0];
		int rank = square_rank(square) + rays[ray][1];
		for (; file >= 0 && file < 8 && rank >= 0 && rank < 8;
		     file += rays[ray][0], rank += rays[ray][1]) {
			bb |= square_bb((Square)(rank * 8 + file));
			if (bb_has(occupied, (Square)(rank * 8 + file))) {
				break;
			}
		}
	}
	return bb;
}

TEST(sliders_equal_a_ray_walk_over_random_occupancies) {
	static const int DIAGONALS[4][2] = {{1, 1}, {1, -1}, {-1, -1}, {-1, 1}};
	static const int LINES[4][2] = {{1, 0}, {0, -1}, {-1, 0}, {0, 1}};
	Rng rng = rng_seed(2024);
	for (int index = 0; index < SQUARE_COUNT; index++) {
		Square square = (Square)index;
		for (int sample = 0; sample < 512; sample++) {
			Bitboard occupied = (Bitboard)rng_next(&rng) << 32 | rng_next(&rng);
			occupied &= sample % 2 ? (Bitboard)rng_next(&rng) << 32 | rng_next(&rng) : occupied;
			CHECK(bishop_attacks(square, occupied) == walk(square, occupied, DIAGONALS));
			CHECK(rook_attacks(square, occupied) == walk(square, occupied, LINES));
		}
	}
}

TEST(leapers_stay_on_the_board) {
	CHECK(knight_attacks(0) == (square_bb(10) | square_bb(17)));
	CHECK(king_attacks(63) == (square_bb(54) | square_bb(55) | square_bb(62)));
	CHECK(pawn_attacks(WHITE, 8) == square_bb(17) && pawn_attacks(BLACK, 15) == square_bb(6));
	CHECK(pawn_attacks(WHITE, 60) == 0 && pawn_attacks(BLACK, 3) == 0);
}
