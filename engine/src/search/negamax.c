#include <stdbool.h>
#include <stddef.h>

#include "bitboard.h"
#include "draw.h"
#include "eval.h"
#include "evaluate.h"
#include "move.h"
#include "movegen.h"
#include "node.h"
#include "picker.h"
#include "position.h"
#include "search.h"

double no_moves_score(const Search *search, const Position *pos, Node node, bool in_check) {
	if (!in_check) {
		return 0;
	}
	// A bot with no opinion on mate — `givesMate` at zero — evaluates the mated position like any
	// other, so the terminal score falls back on the evaluation rather than on a flat number.
	double score = 0;
	if (terminal_score(pos, search->eval.weights, node.ply, &score)) {
		return score;
	}
	return evaluate_features(&search->eval, pos, node.played);
}

double search_child(Search *search, Position *pos, Node child, int depth, double alpha, double beta,
                    bool first) {
	if (first) {
		return -search_node(search, pos, child, depth, -beta, -alpha);
	}
	double score = -search_node(search, pos, child, depth, -next_up(alpha), -alpha);
	if (score > alpha && score < beta && !search->aborted) {
		score = -search_node(search, pos, child, depth, -beta, -alpha);
	}
	return score;
}

// The draw test comes before everything else: the game does not go on from a drawn position, so
// there is nothing to search and nothing to score. The root never asks it — its position is the
// one on the board, which the game has already let stand.
double search_node(Search *search, Position *pos, Node node, int depth, double alpha, double beta) {
	if (position_drawn(pos, search->history)) {
		return 0;
	}
	if (depth <= 0) {
		return quiesce(search, pos, node, alpha, beta);
	}
	if (exhausted(search)) {
		return 0;
	}
	search->nodes++;
	Picker picker;
	picker_start(&picker, search->table != NULL ? table_move(search->table, pos->hash) : MOVE_NONE,
	             node.ply);
	double best = -__builtin_inf();
	Move best_move = MOVE_NONE;
	history_push(search->history, pos->hash);
	for (Move move; (move = picker_next(&picker, search, pos)) != MOVE_NONE;) {
		Played played = played_move(pos, move);
		Undo undo;
		position_make(pos, move, &undo);
		Node child = {.played = &played, .ply = node.ply + 1};
		double floor = alpha > best ? alpha : best;
		double score =
		    search_child(search, pos, child, depth - 1, floor, beta, best_move == MOVE_NONE);
		position_unmake(pos, move, &undo);
		// An aborted child's score is whatever the search was holding when it stopped: nothing
		// is learnt from it, not a cutoff and not a table entry.
		if (search->aborted) {
			history_pop(search->history);
			return 0;
		}
		if (score > best || best_move == MOVE_NONE) {
			best = score;
			best_move = move;
		}
		if (best >= beta) {
			if (!is_capture(pos, move) && move_promotion(move) == PAWN) {
				record_cutoff(search, pos, move, node.ply, depth);
			}
			break;
		}
	}
	history_pop(search->history);
	if (best_move == MOVE_NONE) {
		return no_moves_score(search, pos, node, move_context(pos).checkers != 0);
	}
	if (search->table != NULL) {
		table_store(search->table, pos->hash, best_move);
	}
	return best;
}
