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

// What the rest of the evaluation may swing by on one capture, in the centipawns every weight is
// written in. The wager delta pruning makes: a capture moves mobility and king safety as well as
// the material, and nothing bounds those. Two pawns covers a normal position; a bot built out of
// large behavioural weights will now and then have a line pruned it would have liked.
static const double DELTA_MARGIN = 200;

// A capture that could not lift the standing score to `alpha` even with the man free is not
// searched. Never a promotion, which wins a queen on top of whatever it takes.
static bool hopeless(const Search *search, const Position *pos, Move move, double stand,
                     double alpha) {
	if (move_promotion(move) != PAWN) {
		return false;
	}
	Piece victim = pos->board[move_to(move)];
	double worth = search->worth[victim == PIECE_NONE ? PAWN : piece_role(victim)];
	return stand + worth + DELTA_MARGIN <= alpha;
}

// Past the last ply: the noisy moves from a stand-pat baseline, or every evasion in check, where
// the side to move cannot decline and the baseline would be a fiction. It terminates without a
// budget: out of check every move takes a man, and a run of checks ends in a repetition, which the
// draw test catches, or at MAX_PLY. Without quiescence this is only the leaf.
double quiesce(Search *search, Position *pos, Node node, double alpha, double beta) {
	if (exhausted(search)) {
		return 0;
	}
	search->nodes++;
	bool in_check = move_context(pos).checkers != 0;
	// A plain leaf searches nothing, so it only asks whether a move exists.
	if (!search->quiescence || node.ply >= MAX_PLY - 1) {
		return has_legal_move(pos) ? evaluate_features(&search->eval, pos, node.played)
		                           : no_moves_score(search, pos, node, in_check);
	}
	// Out of check only the moves that change the material are searched, so only they are listed;
	// an empty list is then a stalemate only when no quiet move exists either.
	Move moves[MAX_MOVES];
	int count = in_check ? generate_moves(pos, moves) : generate_noisy(pos, moves);
	if (count == 0 && (in_check || !has_legal_move(pos))) {
		return no_moves_score(search, pos, node, in_check);
	}
	double stand = -__builtin_inf();
	if (!in_check) {
		stand = evaluate_features(&search->eval, pos, node.played);
		if (stand >= beta) {
			return stand;
		}
	}
	order_moves(search, pos, moves, count, node.ply);
	double best = stand;
	history_push(search->history, pos->hash);
	for (int index = 0; index < count && best < beta && !search->aborted; index++) {
		double floor = alpha > best ? alpha : best;
		if (!in_check && hopeless(search, pos, moves[index], stand, floor)) {
			continue;
		}
		Played played = played_move(pos, moves[index]);
		Undo undo;
		position_make(pos, moves[index], &undo);
		Node child = {.played = &played, .ply = node.ply + 1};
		double score =
		    position_drawn(pos, search->history) ? 0 : -quiesce(search, pos, child, -beta, -floor);
		position_unmake(pos, moves[index], &undo);
		best = score > best ? score : best;
	}
	history_pop(search->history);
	return best;
}
