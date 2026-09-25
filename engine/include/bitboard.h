#ifndef ENGINE_BITBOARD_H
#define ENGINE_BITBOARD_H

#include <stdbool.h>
#include <stdint.h>

// chessops's numbering throughout — a1 = 0, b1 = 1, ..., h8 = 63 — and its COLORS and ROLES
// order, so a square, a colour or a role crosses the TS boundary as the same number.
typedef uint64_t Bitboard;
typedef uint8_t Square;
typedef enum { WHITE, BLACK } Color;
// NO_ROLE is what an empty square holds.
typedef enum { NO_ROLE = -1, PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING } Role;

enum { SQUARE_COUNT = 64, COLOR_COUNT = 2, ROLE_COUNT = 6 };

static inline Color opposite(Color color) { return color == WHITE ? BLACK : WHITE; }

static inline Bitboard square_bb(Square square) { return (Bitboard)1 << square; }
static inline int square_file(Square square) { return square & 7; }
static inline int square_rank(Square square) { return square >> 3; }
static inline bool bb_has(Bitboard bb, Square square) { return (bb >> square) & 1; }

// Builtins rather than loops: clang lowers them to popcnt/tzcnt natively and to i64.popcnt /
// i64.ctz in wasm, one instruction either way.
static inline int bb_count(Bitboard bb) { return __builtin_popcountll(bb); }
static inline bool bb_many(Bitboard bb) { return (bb & (bb - 1)) != 0; }

// Undefined on an empty set, as ctz is: every caller has checked `bb` first, and a branch here
// would sit in the innermost loop of move generation.
static inline Square bb_first(Bitboard bb) { return (Square)__builtin_ctzll(bb); }

static inline Square bb_pop(Bitboard *bb) {
	Square square = bb_first(*bb);
	*bb &= *bb - 1;
	return square;
}

#endif
