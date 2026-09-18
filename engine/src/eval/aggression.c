#include "bitboard.h"
#include "eval.h"
#include "families.h"
#include "feature_ids.h"
#include "masks.h"
#include "position.h"
#include "values.h"

// Squares a side's men attack that its own men do not stand on, pawns and king included — the
// stand-in for their legal moves, which would need the other side to move.
static int reachable(const EvalContext *ctx, Color color) {
	Bitboard own = ctx->pos->colors[color];
	int total = 0;
	for (Bitboard men = own; men != 0;) {
		total += bb_count(ctx->reach[bb_pop(&men)] & ~own);
	}
	return total;
}

// How far past the halfway line a side's men stand, counted from the line.
static int push_depth(const Position *pos, Color color) {
	int total = 0;
	for (Bitboard men = pos->colors[color]; men != 0;) {
		int past = relative_rank(color, bb_pop(&men)) - 3;
		total += past > 0 ? past : 0;
	}
	return total;
}

// Material `color` leaves to be taken, once per enemy man that could take it.
static int offered(const EvalContext *ctx, Color color) {
	const Position *pos = ctx->pos;
	int total = 0;
	for (Bitboard enemies = pos->colors[opposite(color)]; enemies != 0;) {
		for (Bitboard targets = ctx->reach[bb_pop(&enemies)] & pos->colors[color]; targets != 0;) {
			total += classical_value(piece_role(pos->board[bb_pop(&targets)]));
		}
	}
	return total;
}

// `extractAggression`: taking the opponent's moves away — a raw count of theirs, nothing to
// subtract — pushing everything forward, and handing out material on purpose.
void extract_aggression(EvalContext *ctx, float *features) {
	eval_walk(ctx);
	const Position *pos = ctx->pos;
	features[FEATURE_OPPONENT_MOBILITY] = (float)reachable(ctx, ctx->them);
	features[FEATURE_PUSH_DEPTH] = (float)(push_depth(pos, ctx->us) - push_depth(pos, ctx->them));
	features[FEATURE_OFFERED_MATERIAL] = (float)(offered(ctx, ctx->us) - offered(ctx, ctx->them));
}
