#include "bitboard.h"
#include "eval.h"
#include "extractors.h"
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

// Each difference is scaled by `1 - phase`, silent while the pieces are on — and not worked out
// then, which is most of a middlegame search. The product is taken in double and rounded once, as
// the frozen fixture was; a silent feature reads +0, never the -0 a negative difference times
// zero would give.
float extract_king_activity(EvalContext *ctx) {
	const Position *pos = ctx->pos;
	double late = 1 - eval_phase(pos);
	if (late == 0) {
		return 0;
	}
	return (float)((king_centrality(pos, ctx->us) - king_centrality(pos, ctx->them)) * late);
}

float extract_passed_pawn_push(EvalContext *ctx) {
	const Position *pos = ctx->pos;
	double late = 1 - eval_phase(pos);
	if (late == 0) {
		return 0;
	}
	return (float)((passers(pos, ctx->us) - passers(pos, ctx->them)) * late);
}
