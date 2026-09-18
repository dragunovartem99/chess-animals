#include "picker.h"

#include "move.h"
#include "movegen.h"
#include "node.h"
#include "position.h"
#include "search.h"

enum { STAGE_START, STAGE_TABLE, STAGE_NOISY, STAGE_QUIET, STAGE_DONE };

void picker_start(Picker *picker, Move table, int ply) {
	picker->count = 0;
	picker->next = 0;
	picker->stage = STAGE_START;
	picker->table = table;
	picker->ply = ply;
}

// One stage's moves and their priorities, the table's move left out of the lists: it has been
// searched already.
static int fill(Picker *picker, const Search *search, const Position *pos) {
	if (picker->stage == STAGE_TABLE) {
		if (picker->table == MOVE_NONE || !is_legal_move(pos, picker->table)) {
			picker->table = MOVE_NONE;
			return 0;
		}
		picker->moves[0] = picker->table;
		picker->priorities[0] = 0;
		return 1;
	}
	if (picker->stage == STAGE_DONE) {
		return 0;
	}
	bool noisy = picker->stage == STAGE_NOISY;
	int count = noisy ? generate_noisy(pos, picker->moves) : generate_quiet(pos, picker->moves);
	int kept = 0;
	for (int index = 0; index < count; index++) {
		Move move = picker->moves[index];
		if (move == picker->table) {
			continue;
		}
		picker->moves[kept] = move;
		picker->priorities[kept++] =
		    noisy ? noisy_priority(pos, move) : quiet_priority(search, pos, move, picker->ply);
	}
	return kept;
}

// Selection rather than a sort, since a node that cuts on its first few moves never needs the
// rest in order. The first of the highest is taken and the moves it passes shift up behind it,
// so equals keep the generated order, as a stable sort would.
static Move take_best(Picker *picker) {
	int best = picker->next;
	for (int index = best + 1; index < picker->count; index++) {
		best = picker->priorities[index] > picker->priorities[best] ? index : best;
	}
	Move move = picker->moves[best];
	for (int index = best; index > picker->next; index--) {
		picker->moves[index] = picker->moves[index - 1];
		picker->priorities[index] = picker->priorities[index - 1];
	}
	picker->next++;
	return move;
}

Move picker_next(Picker *picker, const Search *search, const Position *pos) {
	while (picker->next == picker->count) {
		if (picker->stage == STAGE_DONE) {
			return MOVE_NONE;
		}
		picker->stage++;
		picker->next = 0;
		picker->count = fill(picker, search, pos);
	}
	return take_best(picker);
}
