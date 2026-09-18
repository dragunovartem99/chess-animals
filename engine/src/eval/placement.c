#include <stdint.h>

#include "bitboard.h"
#include "eval.h"
#include "extractors.h"
#include "masks.h"
#include "position.h"

// The a–c and g–h files: where a castled king ends up, or the corner beside it.
static const Bitboard WINGS = 0xc7c7c7c7c7c7c7c7U;

// +1 with the king tucked on a wing of its own back rank, 0 while a right still lets it get
// there, -1 once the rights are spent with it stuck in the middle.
static int castled_state(EvalContext *ctx, Color color) {
	const Position *pos = ctx->pos;
	Bitboard king = pos->roles[KING] & pos->colors[color];
	if ((king & WINGS & back_rank(color)) != 0) {
		return 1;
	}
	uint8_t rights =
	    color == WHITE ? CASTLE_WHITE_H | CASTLE_WHITE_A : CASTLE_BLACK_H | CASTLE_BLACK_A;
	return (pos->castling & rights) != 0 ? 0 : -1;
}

// How far the pieces stand from the rim; pawns and the king are not pieces here.
static int total_centrality(EvalContext *ctx, Color color) {
	const Position *pos = ctx->pos;
	int total = 0;
	for (Bitboard men = pos->colors[color] & ~(pos->roles[PAWN] | pos->roles[KING]); men != 0;) {
		total += centrality(bb_pop(&men));
	}
	return total;
}

static int developed(EvalContext *ctx, Color color) {
	const Position *pos = ctx->pos;
	Bitboard minors = pos->colors[color] & (pos->roles[KNIGHT] | pos->roles[BISHOP]);
	return bb_count(minors & ~back_rank(color));
}

// A queen off her home square but still on the board jumped each of her minors left at home.
static int early_queen(EvalContext *ctx, Color color) {
	const Position *pos = ctx->pos;
	Bitboard ours = pos->colors[color];
	Bitboard queens = ours & pos->roles[QUEEN];
	Square home = color == WHITE ? 3 : 59;
	if (queens == 0 || bb_has(queens, home)) {
		return 0;
	}
	Bitboard knights_home = color == WHITE ? 0x42U : 0x4200000000000000U;
	Bitboard bishops_home = color == WHITE ? 0x24U : 0x2400000000000000U;
	return bb_count(ours & pos->roles[KNIGHT] & knights_home) +
	       bb_count(ours & pos->roles[BISHOP] & bishops_home);
}

float extract_centralization(EvalContext *ctx) { return side_difference(ctx, total_centrality); }
float extract_development(EvalContext *ctx) { return side_difference(ctx, developed); }
float extract_early_queen(EvalContext *ctx) { return side_difference(ctx, early_queen); }
float extract_castled(EvalContext *ctx) { return side_difference(ctx, castled_state); }
