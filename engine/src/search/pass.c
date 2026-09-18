#include <stdbool.h>
#include <stddef.h>

#include "draw.h"
#include "eval.h"
#include "move.h"
#include "node.h"
#include "position.h"
#include "search.h"

// The shuffle's place of the move tried at `step`: the lead first, then the rest in order.
static int rank_at(Root root, int step) {
	if (step == 0) {
		return root.lead;
	}
	return step <= root.lead ? step - 1 : step;
}

// Trying the last pass's best first is what makes a pass cheap: its score is the window every
// other move is held to. It must not also win the ties it was moved ahead for, so a move the
// shuffle placed before the best so far takes over on an equal score — its window opens just
// below that score — and one placed after it has to beat it outright, exactly as in a plain
// pass over the shuffle.
SearchResult search_pass(Search *search, Position *pos, Root root, int depth) {
	SearchResult result = {.best = MOVE_NONE, .score = -__builtin_inf()};
	if (exhausted(search)) {
		return result;
	}
	search->nodes++;
	int best_rank = root.count;
	history_push(search->history, pos->hash);
	for (int step = 0; step < root.count; step++) {
		int rank = rank_at(root, step);
		double alpha = result.score;
		if (result.best != MOVE_NONE && rank < best_rank) {
			alpha = next_down(result.score);
		}
		Move move = root.moves[rank];
		Played played = played_move(pos, move);
		Undo undo;
		position_make(pos, move, &undo);
		Node child = {.played = &played, .ply = 1};
		double score =
		    search_child(search, pos, child, depth - 1, alpha, __builtin_inf(), step == 0);
		position_unmake(pos, move, &undo);
		if (search->aborted) {
			break;
		}
		if (score > alpha) {
			result = (SearchResult){.best = move, .score = score};
			best_rank = rank;
		}
	}
	history_pop(search->history);
	return result;
}
