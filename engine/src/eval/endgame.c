#include "bitboard.h"
#include "eval.h"
#include "families.h"
#include "feature_ids.h"
#include "masks.h"
#include "position.h"

// A side's passed pawns, each by how far it has run.
static int passers(const Position *pos, Color color) {
	Bitboard enemy_pawns = pos->roles[PAWN] & pos->colors[opposite(color)];
	int total = 0;
	for (Bitboard pawns = pos->roles[PAWN] & pos->colors[color]; pawns != 0;) {
		Square square = bb_pop(&pawns);
		total += (passed_span(color, square) & enemy_pawns) == 0 ? relative_rank(color, square) : 0;
	}
	return total;
}

static int king_centrality(const Position *pos, Color color) {
	return centrality(bb_first(pos->roles[KING] & pos->colors[color]));
}

// `extractEndgame`: each difference scaled by `1 - phase`, silent while the pieces are on. The
// product is taken in double and rounded once, as the TS number is on its way into the vector.
void extract_endgame(EvalContext *ctx, float *features) {
	const Position *pos = ctx->pos;
	double late = 1 - eval_phase(pos);
	if (late == 0) {
		return;
	}
	int king = king_centrality(pos, ctx->us) - king_centrality(pos, ctx->them);
	int passed = passers(pos, ctx->us) - passers(pos, ctx->them);
	features[FEATURE_KING_ACTIVITY] = (float)(king * late);
	features[FEATURE_PASSED_PAWN_PUSH] = (float)(passed * late);
}
