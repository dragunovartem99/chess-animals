#include "bitboard.h"
#include "eval.h"
#include "extractors.h"
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

// `mobility`: our squares to go to minus theirs.
float extract_mobility(EvalContext *ctx) {
	eval_walk(ctx);
	return side_difference(ctx, count_moves);
}
