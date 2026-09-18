#ifndef ENGINE_SEARCH_PICKER_H
#define ENGINE_SEARCH_PICKER_H

#include "move.h"
#include "movegen.h"
#include "position.h"
#include "search.h"

// A node's moves handed out one at a time, generated in stages: the table's move, then the noisy
// moves by MVV-LVA, then the quiet ones — the ply's killers, then by `cutoffs`. A stage is only
// generated once the one before it is spent, so a node that cuts on a capture never lists the
// quiet moves.
typedef struct {
	Move moves[MAX_MOVES];
	int priorities[MAX_MOVES];
	int count;
	int next;
	int stage;
	Move table;
	int ply;
} Picker;

// Fields rather than a returned struct: a compound literal would zero both lists on every node.
// `table` is MOVE_NONE when the position has no entry; an entry that is not legal here is skipped.
void picker_start(Picker *picker, Move table, int ply);

// MOVE_NONE once every legal move has been handed out.
Move picker_next(Picker *picker, const Search *search, const Position *pos);

#endif
