#include "attacks.h"
#include "bitboard.h"
#include "tables.h"

Bitboard line_table[SQUARE_COUNT][SQUARE_COUNT];
Bitboard between_table[SQUARE_COUNT][SQUARE_COUNT];

// Read off the slider tables, so it runs after `magics_init`: two squares share a line when one
// attacks the other on an empty board, and the squares between them are what both attack with
// only the other standing there.
void lines_init(void) {
	for (int a = 0; a < SQUARE_COUNT; a++) {
		for (int b = 0; b < SQUARE_COUNT; b++) {
			Square from = (Square)a;
			Square to = (Square)b;
			Bitboard ends = square_bb(from) | square_bb(to);
			if (bb_has(bishop_attacks(from, 0), to)) {
				line_table[a][b] = (bishop_attacks(from, 0) & bishop_attacks(to, 0)) | ends;
				between_table[a][b] =
				    bishop_attacks(from, square_bb(to)) & bishop_attacks(to, square_bb(from));
			} else if (bb_has(rook_attacks(from, 0), to)) {
				line_table[a][b] = (rook_attacks(from, 0) & rook_attacks(to, 0)) | ends;
				between_table[a][b] =
				    rook_attacks(from, square_bb(to)) & rook_attacks(to, square_bb(from));
			}
		}
	}
}
