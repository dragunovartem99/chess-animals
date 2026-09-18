#include "bitboard.h"
#include "eval.h"
#include "extractors.h"
#include "masks.h"
#include "position.h"

static Square king_of(const EvalContext *ctx, Color color) {
	return bb_first(ctx->pos->roles[KING] & ctx->pos->colors[color]);
}

// An army's mean distance to a king, in king moves — the mean, not the total, so a side ahead in
// material does not read as the worse swarmer. A double divided once, as the frozen fixture was. An
// army always holds its king, so the mean never divides by zero.
static double mean_distance(const EvalContext *ctx, Color army, Color king) {
	Square target = king_of(ctx, king);
	int total = 0;
	int count = 0;
	for (Bitboard men = ctx->pos->colors[army]; men != 0; count++) {
		total += chebyshev(bb_pop(&men), target);
	}
	return (double)total / count;
}

// The distance strategies, negated so more is nearer and a positive weight is the charge each key
// names: `swarm` closes on their king, `huddle` gathers round our own.
float extract_swarm(EvalContext *ctx) {
	return (float)(mean_distance(ctx, ctx->them, ctx->us) - mean_distance(ctx, ctx->us, ctx->them));
}

float extract_huddle(EvalContext *ctx) {
	return (float)(mean_distance(ctx, ctx->them, ctx->them) - mean_distance(ctx, ctx->us, ctx->us));
}

float extract_king_proximity(EvalContext *ctx) {
	return (float)-chebyshev(king_of(ctx, ctx->us), king_of(ctx, ctx->them));
}
