#include <stdbool.h>
#include <stddef.h>

#include "bitboard.h"
#include "draw.h"
#include "eval.h"
#include "evaluate.h"
#include "move.h"
#include "movegen.h"
#include "position.h"
#include "reference.h"
#include "search.h"

static const double INF = __builtin_inf();

static bool noisy(const Position *pos, Move move) {
	Piece target = pos->board[move_to(move)];
	bool takes = target != PIECE_NONE && piece_color(target) != pos->turn;
	bool en_passant = piece_role(pos->board[move_from(move)]) == PAWN && move_to(move) == pos->ep;
	return takes || en_passant || move_promotion(move) != PAWN;
}

// Biggest victim first, cheapest attacker first: ordering changes no score, only how much
// alpha-beta prunes, and unordered it walks every capture chain in the quiescence tail.
static int victim_first(const Position *pos, Move move) {
	static const int VALUE[ROLE_COUNT] = {1, 3, 3, 5, 9, 0};
	Piece target = pos->board[move_to(move)];
	int victim = noisy(pos, move) ? 1 : 0;
	if (target != PIECE_NONE && piece_color(target) != pos->turn) {
		victim = VALUE[piece_role(target)];
	}
	return victim * 16 - VALUE[piece_role(pos->board[move_from(move)])];
}

static void order(const Position *pos, Move *moves, int count) {
	for (int index = 1; index < count; index++) {
		Move move = moves[index];
		int slot = index - 1;
		while (slot >= 0 && victim_first(pos, moves[slot]) < victim_first(pos, move)) {
			moves[slot + 1] = moves[slot];
			slot--;
		}
		moves[slot + 1] = move;
	}
}

typedef struct {
	const Played *played;
	int ply;
	int depth;
} Frame;

static double node(Reference *ref, Position *pos, Frame frame, double alpha, double beta);

// Every child of `pos`, or only the noisy ones, scored from the mover's side on top of `best`.
static double children(Reference *ref, Position *pos, Frame frame, double best, double alpha,
                       double beta, bool quiet_too) {
	Move moves[MAX_MOVES];
	int count = generate_moves(pos, moves);
	order(pos, moves, count);
	history_push(ref->history, pos->hash);
	for (int index = 0; index < count; index++) {
		if (!quiet_too && !noisy(pos, moves[index])) {
			continue;
		}
		double floor = alpha > best ? alpha : best;
		Played played = played_move(pos, moves[index]);
		Undo undo;
		position_make(pos, moves[index], &undo);
		Frame child = {.played = &played, .ply = frame.ply + 1, .depth = frame.depth - 1};
		double score = -node(ref, pos, child, -beta, -floor);
		position_unmake(pos, moves[index], &undo);
		best = score > best ? score : best;
		if (ref->pruned && best >= beta) {
			break;
		}
	}
	history_pop(ref->history);
	return best;
}

static double node(Reference *ref, Position *pos, Frame frame, double alpha, double beta) {
	if (!ref->pruned) {
		alpha = -INF;
		beta = INF;
	}
	if (position_drawn(pos, ref->history)) {
		return 0;
	}
	Move moves[MAX_MOVES];
	bool in_check = move_context(pos).checkers != 0;
	if (generate_moves(pos, moves) == 0) {
		return in_check ? evaluate(&ref->eval, pos, frame.played, frame.ply) : 0;
	}
	if (frame.depth > 0) {
		return children(ref, pos, frame, -INF, alpha, beta, true);
	}
	if (!ref->quiescence || frame.ply >= MAX_PLY - 1) {
		return evaluate_features(&ref->eval, pos, frame.played);
	}
	if (in_check) {
		return children(ref, pos, frame, -INF, alpha, beta, true);
	}
	double stand = evaluate_features(&ref->eval, pos, frame.played);
	if (ref->pruned && stand >= beta) {
		return stand;
	}
	return children(ref, pos, frame, stand, alpha, beta, false);
}

SearchResult reference_root(Reference *ref, Position *pos, int depth) {
	Move moves[MAX_MOVES];
	int count = generate_moves(pos, moves);
	SearchResult result = {.best = MOVE_NONE, .score = -INF};
	history_push(ref->history, pos->hash);
	for (int index = 0; index < count; index++) {
		Played played = played_move(pos, moves[index]);
		Undo undo;
		position_make(pos, moves[index], &undo);
		Frame child = {.played = &played, .ply = 1, .depth = depth - 1};
		double score = -node(ref, pos, child, -INF, -result.score);
		position_unmake(pos, moves[index], &undo);
		if (score > result.score) {
			result = (SearchResult){.best = moves[index], .score = score};
		}
	}
	history_pop(ref->history);
	return result;
}
