#ifndef ENGINE_ATTACKS_H
#define ENGINE_ATTACKS_H

#include <stdint.h>

#include "bitboard.h"
#include "position.h"

// Fancy magic bitboards: the relevant blockers of a slider, multiplied by a magic and shifted,
// index a table of every attack set that square can have. One multiply and one load per slider,
// where chessops's hyperbola quintessence does a byte swap and subtractions per ray.
typedef struct {
	Bitboard mask;
	uint64_t magic;
	const Bitboard *table;
	unsigned shift;
} Magic;

extern Magic bishop_magics[SQUARE_COUNT];
extern Magic rook_magics[SQUARE_COUNT];
extern Bitboard knight_table[SQUARE_COUNT];
extern Bitboard king_table[SQUARE_COUNT];
extern Bitboard pawn_table[COLOR_COUNT][SQUARE_COUNT];

// Builds the tables; `engine_init` calls it once, before any lookup.
void attacks_init(void);

static inline Bitboard magic_lookup(const Magic *magic, Bitboard occupied) {
	return magic->table[((occupied & magic->mask) * magic->magic) >> magic->shift];
}

static inline Bitboard bishop_attacks(Square square, Bitboard occupied) {
	return magic_lookup(&bishop_magics[square], occupied);
}
static inline Bitboard rook_attacks(Square square, Bitboard occupied) {
	return magic_lookup(&rook_magics[square], occupied);
}
static inline Bitboard queen_attacks(Square square, Bitboard occupied) {
	return bishop_attacks(square, occupied) | rook_attacks(square, occupied);
}
static inline Bitboard knight_attacks(Square square) { return knight_table[square]; }
static inline Bitboard king_attacks(Square square) { return king_table[square]; }
static inline Bitboard pawn_attacks(Color color, Square square) {
	return pawn_table[color][square];
}

// chessops's `attacks(piece, square, occupied)`: what the piece attacks from the square, whether
// or not it stands there.
static inline Bitboard piece_attacks(Piece piece, Square square, Bitboard occupied) {
	switch (piece_role(piece)) {
	case PAWN:
		return pawn_attacks(piece_color(piece), square);
	case KNIGHT:
		return knight_attacks(square);
	case BISHOP:
		return bishop_attacks(square, occupied);
	case ROOK:
		return rook_attacks(square, occupied);
	case QUEEN:
		return queen_attacks(square, occupied);
	default:
		return king_attacks(square);
	}
}

#endif
