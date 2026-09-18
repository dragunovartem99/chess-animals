#include "bitboard.h"
#include "eval.h"
#include "extractors.h"
#include "position.h"

// d4, e4, d5 and e5 — chessops's `SquareSet.center()`.
static const Bitboard CENTER = 0x0000001818000000U;

// The four ranks on the far side of the board, from each side's seat.
static const Bitboard ENEMY_HALF[COLOR_COUNT] = {0xffffffff00000000U, 0x00000000ffffffffU};

static int center_attacks(EvalContext *ctx, Color color) {
	return bb_count(ctx->attacks_by[color] & CENTER);
}

static int space(EvalContext *ctx, Color color) {
	return bb_count(ctx->attacks_by[color] & ENEMY_HALF[color]);
}

// Men of `color` the other side attacks and `color` does not defend. The king is left out: it can
// never simply be taken, and it is always "attacked" in check.
static int count_hanging(EvalContext *ctx, Color color) {
	const Position *pos = ctx->pos;
	Bitboard exposed = pos->colors[color] & ~pos->roles[KING] & ctx->attacks_by[opposite(color)] &
	                   ~ctx->attacks_by[color];
	return bb_count(exposed);
}

// Who holds the middle, who has room, who has left something en prise — each ours minus theirs.
float extract_center_control(EvalContext *ctx) {
	eval_walk(ctx);
	return side_difference(ctx, center_attacks);
}

float extract_space(EvalContext *ctx) {
	eval_walk(ctx);
	return side_difference(ctx, space);
}

float extract_hanging(EvalContext *ctx) {
	eval_walk(ctx);
	return side_difference(ctx, count_hanging);
}
