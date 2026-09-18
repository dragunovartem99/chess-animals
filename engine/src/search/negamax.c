#include <stdbool.h>

#include "bitboard.h"
#include "draw.h"
#include "eval.h"
#include "evaluate.h"
#include "move.h"
#include "movegen.h"
#include "node.h"
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

static void record_killer(Search *search, Move move, int ply) {
	if (search->killers[ply][0] != move) {
		search->killers[ply][1] = search->killers[ply][0];
		search->killers[ply][0] = move;
	}
}

double search_child(Search *search, Position *pos, Node child, int depth, double alpha, double beta,
                    bool first) {
	if (first) {
		return -search_node(search, pos, child, depth, -beta, -alpha);
	}
	double score = -search_node(search, pos, child, depth, -next_up(alpha), -alpha);
	if (score > alpha && score < beta) {
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
	search->nodes++;
	Move moves[MAX_MOVES];
	int count = generate_moves(pos, moves);
	if (count == 0) {
		return no_moves_score(search, pos, node, move_context(pos).checkers != 0);
	}
	order_moves(search, pos, moves, count, node.ply);
	double best = -__builtin_inf();
	history_push(search->history, pos->hash);
	for (int index = 0; index < count; index++) {
		Played played = played_move(pos, moves[index]);
		Undo undo;
		position_make(pos, moves[index], &undo);
		Node child = {.played = &played, .ply = node.ply + 1};
		double floor = alpha > best ? alpha : best;
		double score = search_child(search, pos, child, depth - 1, floor, beta, index == 0);
		position_unmake(pos, moves[index], &undo);
		best = score > best ? score : best;
		if (best >= beta) {
			if (!is_capture(pos, moves[index]) && move_promotion(moves[index]) == PAWN) {
				record_killer(search, moves[index], node.ply);
			}
			break;
		}
	}
	history_pop(search->history);
	return best;
}
