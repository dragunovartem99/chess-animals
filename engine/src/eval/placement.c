#include <stdint.h>

#include "bitboard.h"
#include "eval.h"
#include "families.h"
#include "feature_ids.h"
#include "masks.h"
#include "position.h"

// The a–c and g–h files: where a castled king ends up, or the corner beside it.
static const Bitboard WINGS = 0xc7c7c7c7c7c7c7c7U;

// +1 with the king tucked on a wing of its own back rank, 0 while a right still lets it get
// there, -1 once the rights are spent with it stuck in the middle.
static int castled_state(const Position *pos, Color color) {
	Bitboard king = pos->roles[KING] & pos->colors[color];
	if ((king & WINGS & back_rank(color)) != 0) {
		return 1;
	}
	uint8_t rights =
	    color == WHITE ? CASTLE_WHITE_H | CASTLE_WHITE_A : CASTLE_BLACK_H | CASTLE_BLACK_A;
	return (pos->castling & rights) != 0 ? 0 : -1;
}

static int total_centrality(Bitboard squares) {
	int total = 0;
	while (squares != 0) {
		total += centrality(bb_pop(&squares));
	}
	return total;
}

// A queen off her home square but still on the board jumped each of her minors left at home.
static int early_queen(const Position *pos, Color color) {
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

// `extractPlacement`: each of the four is the side to move's count minus the opponent's.
void extract_placement(EvalContext *ctx, float *features) {
	const Position *pos = ctx->pos;
	int central = 0;
	int developed = 0;
	int queen_early = 0;
	int castled = 0;
	for (int side = 0; side < 2; side++) {
		Color color = side == 0 ? ctx->us : ctx->them;
		int sign = side == 0 ? 1 : -1;
		Bitboard ours = pos->colors[color];
		Bitboard minors = ours & (pos->roles[KNIGHT] | pos->roles[BISHOP]);
		castled += sign * castled_state(pos, color);
		central += sign * total_centrality(ours & ~(pos->roles[PAWN] | pos->roles[KING]));
		developed += sign * bb_count(minors & ~back_rank(color));
		queen_early += sign * early_queen(pos, color);
	}
	features[FEATURE_CENTRALIZATION] = (float)central;
	features[FEATURE_DEVELOPMENT] = (float)developed;
	features[FEATURE_EARLY_QUEEN] = (float)queen_early;
	features[FEATURE_CASTLED] = (float)castled;
}
