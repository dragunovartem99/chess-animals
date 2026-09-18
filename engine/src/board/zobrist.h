#ifndef ENGINE_BOARD_ZOBRIST_H
#define ENGINE_BOARD_ZOBRIST_H

#include <stdint.h>

#include "position.h"

// Indexed by Piece directly, so the empty square's row stays zero and hashing a square needs no
// branch on whether anything stands there.
extern uint64_t zobrist_pieces[PIECE_LIMIT][SQUARE_COUNT];
extern uint64_t zobrist_castling[16];
extern uint64_t zobrist_ep[SQUARE_COUNT + 1];
extern uint64_t zobrist_black;

#endif
