#include "bitboard.h"
#include "eval.h"
#include "extractors.h"
#include "position.h"

// The count difference per role, so the weight is the piece value. Kings are left out: both
// sides always have exactly one.
static float material(const EvalContext *ctx, Role role) {
	const Position *pos = ctx->pos;
	int ours = bb_count(pos->roles[role] & pos->colors[ctx->us]);
	int theirs = bb_count(pos->roles[role] & pos->colors[ctx->them]);
	return (float)(ours - theirs);
}

float extract_material_pawn(EvalContext *ctx) { return material(ctx, PAWN); }
float extract_material_knight(EvalContext *ctx) { return material(ctx, KNIGHT); }
float extract_material_bishop(EvalContext *ctx) { return material(ctx, BISHOP); }
float extract_material_rook(EvalContext *ctx) { return material(ctx, ROOK); }
float extract_material_queen(EvalContext *ctx) { return material(ctx, QUEEN); }
