#include <stdint.h>

#include "move.h"
#include "node.h"
#include "search.h"

enum { MOVE_BITS = 16 };

static const uint64_t MOVE_MASK = (1U << MOVE_BITS) - 1;

// Cleared on every search rather than stamped with a generation: 128 KB is cheap next to any
// search deep enough to use it, and a stamp would not fit beside the key in one word.
void table_clear(Table *table) {
	for (int index = 0; index < TABLE_SIZE; index++) {
		table->slots[index] = 0;
	}
}

// The low bits pick the slot, so only the high ones need keeping; a move fills exactly the rest.
Move table_move(const Table *table, uint64_t hash) {
	uint64_t slot = table->slots[hash & (TABLE_SIZE - 1)];
	return (slot ^ hash) >> MOVE_BITS == 0 ? (Move)(slot & MOVE_MASK) : MOVE_NONE;
}

void table_store(Table *table, uint64_t hash, Move move) {
	table->slots[hash & (TABLE_SIZE - 1)] = (hash & ~MOVE_MASK) | move;
}
