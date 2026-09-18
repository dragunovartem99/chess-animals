#include "bitboard.h"
#include "eval.h"
#include "families.h"
#include "feature_ids.h"
#include "position.h"

// Destination squares, not legal moves — pins go unresolved. Pawns and the king are left out: a
// pawn's moves are structure, and counting the king's would reward walking it into the open.
static int count_moves(EvalContext *ctx, Color color) {
	const Position *pos = ctx->pos;
	Bitboard own = pos->colors[color];
	Bitboard men = own & ~(pos->roles[PAWN] | pos->roles[KING]);
	int total = 0;
	while (men != 0) {
		total += bb_count(ctx->reach[bb_pop(&men)] & ~own);
	}
	return total;
}

// `extractMobility`: our squares to go to minus theirs.
void extract_mobility(EvalContext *ctx, float *features) {
	eval_walk(ctx);
	features[FEATURE_MOBILITY] = (float)(count_moves(ctx, ctx->us) - count_moves(ctx, ctx->them));
}
