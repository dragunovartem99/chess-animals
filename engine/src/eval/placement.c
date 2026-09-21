#include "bitboard.h"
#include "eval.h"
#include "extractors.h"
#include "masks.h"
#include "position.h"

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
