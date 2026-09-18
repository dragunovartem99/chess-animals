#ifndef ENGINE_MOVE_H
#define ENGINE_MOVE_H

#include <stdbool.h>
#include <stdint.h>

#include "bitboard.h"

// from | to << 6 | promotion << 12, where a promotion is the role the pawn becomes and 0 means
// none — a pawn is never promoted to a pawn, so PAWN doubles as "no promotion". Castling is
// the king taking its own rook, as chessops writes it: the move says which rook, so it carries
// no flag of its own, and neither does en passant, which the board makes plain.
typedef uint16_t Move;

enum { MOVE_NONE = 0, UCI_MAX = 6 };

static inline Move make_move(Square from, Square to, Role promotion) {
	return (Move)((unsigned)from | (unsigned)to << 6 | (unsigned)promotion << 12);
}
static inline Square move_from(Move move) { return move & 63; }
static inline Square move_to(Move move) { return (move >> 6) & 63; }
static inline Role move_promotion(Move move) { return (Role)(move >> 12); }

// Long algebraic, as UCI and chessops's `parseUci` read it; a promotion is one of `nbrq`.
bool move_from_uci(const char *uci, Move *move);

// Writes the move and a terminating NUL into `out`, which holds at least UCI_MAX bytes.
void move_to_uci(Move move, char *out);

#endif
