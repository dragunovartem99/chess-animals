#include "bitboard.h"
#include "eval.h"
#include "families.h"
#include "feature_ids.h"
#include "position.h"

// d4, e4, d5 and e5 — chessops's `SquareSet.center()`.
static const Bitboard CENTER = 0x0000001818000000U;

// The four ranks on the far side of the board, from each side's seat.
static const Bitboard ENEMY_HALF[COLOR_COUNT] = {0xffffffff00000000U, 0x00000000ffffffffU};

// Men of `color` the other side attacks and `color` does not defend. The king is left out: it can
// never simply be taken, and it is always "attacked" in check.
static int count_hanging(const EvalContext *ctx, Color color) {
	const Position *pos = ctx->pos;
	Bitboard exposed = pos->colors[color] & ~pos->roles[KING] & ctx->attacks_by[opposite(color)] &
	                   ~ctx->attacks_by[color];
	return bb_count(exposed);
}

// `extractControl`: who holds the middle, who has room, who has left something en prise — each
// ours minus theirs.
void extract_control(EvalContext *ctx, float *features) {
	eval_walk(ctx);
	Bitboard ours = ctx->attacks_by[ctx->us];
	Bitboard theirs = ctx->attacks_by[ctx->them];
	features[FEATURE_CENTER_CONTROL] = (float)(bb_count(ours & CENTER) - bb_count(theirs & CENTER));
	features[FEATURE_SPACE] =
	    (float)(bb_count(ours & ENEMY_HALF[ctx->us]) - bb_count(theirs & ENEMY_HALF[ctx->them]));
	features[FEATURE_HANGING] =
	    (float)(count_hanging(ctx, ctx->us) - count_hanging(ctx, ctx->them));
}
