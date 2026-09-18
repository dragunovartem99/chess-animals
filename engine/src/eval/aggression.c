#include "bitboard.h"
#include "eval.h"
#include "extractors.h"
#include "masks.h"
#include "position.h"
#include "values.h"

// Squares a side's men attack that its own men do not stand on, pawns and king included — the
// stand-in for their legal moves, which would need the other side to move.
static int reachable(EvalContext *ctx, Color color) {
	Bitboard own = ctx->pos->colors[color];
	int total = 0;
	for (Bitboard men = own; men != 0;) {
		total += bb_count(ctx->reach[bb_pop(&men)] & ~own);
	}
	return total;
}

// How far past the halfway line a side's men stand, counted from the line.
static int push_depth(EvalContext *ctx, Color color) {
	int total = 0;
	for (Bitboard men = ctx->pos->colors[color]; men != 0;) {
		int past = relative_rank(color, bb_pop(&men)) - 3;
		total += past > 0 ? past : 0;
	}
	return total;
}

// Material `color` leaves to be taken, once per enemy man that could take it.
static int offered(EvalContext *ctx, Color color) {
	const Position *pos = ctx->pos;
	int total = 0;
	for (Bitboard enemies = pos->colors[opposite(color)]; enemies != 0;) {
		for (Bitboard targets = ctx->reach[bb_pop(&enemies)] & pos->colors[color]; targets != 0;) {
			total += classical_value(piece_role(pos->board[bb_pop(&targets)]));
		}
	}
	return total;
}

// Taking the opponent's moves away — a raw count of theirs, nothing to subtract.
float extract_opponent_mobility(EvalContext *ctx) {
	eval_walk(ctx);
	return (float)reachable(ctx, ctx->them);
}

// Pushing everything forward: the one aggression feature that needs no walk.
float extract_push_depth(EvalContext *ctx) { return side_difference(ctx, push_depth); }

// Handing out material on purpose.
float extract_offered_material(EvalContext *ctx) {
	eval_walk(ctx);
	return side_difference(ctx, offered);
}
