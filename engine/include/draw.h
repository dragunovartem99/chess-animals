#ifndef ENGINE_DRAW_H
#define ENGINE_DRAW_H

#include <stdbool.h>
#include <stdint.h>

#include "position.h"

// A power of two, so the ring indexes with a mask. Only the last `halfmoves` entries can ever
// repeat, and `position_drawn` calls a draw at 100 before it asks, so 256 is never outrun.
enum { HISTORY_SIZE = 256 };

// The positions a line has stood in — the game so far, then the search's own ancestors — as
// Zobrist hashes: `createRepetition` with the key kept incrementally rather than re-mixed per ask.
// Pushed before a move is made and popped after it is unmade, so at any node it holds exactly
// that node's ancestors.
typedef struct {
	uint64_t hashes[HISTORY_SIZE];
	unsigned length;
} History;

static inline void history_push(History *history, uint64_t hash) {
	history->hashes[history->length++ & (HISTORY_SIZE - 1)] = hash;
}

static inline void history_pop(History *history) { history->length--; }

// Whether the position has stood on the board before, in the game or higher up this line.
bool history_repeats(const History *history, const Position *pos);

// chessops's `isInsufficientMaterial`: neither side has the men left to mate with.
bool insufficient_material(const Position *pos);

// `createDrawTest`: the draws a search sees for itself and scores 0 — fifty moves unless the last
// one mated, insufficient material, and a single repetition rather than the rule's three.
// Stalemate is the terminal score's, as mate is.
bool position_drawn(const Position *pos, const History *history);

#endif
