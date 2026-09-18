#include "bitboard.h"
#include "eval.h"
#include "families.h"
#include "feature_ids.h"
#include "position.h"

// The count difference per role, so the weight is the piece value. Kings are left out: both
// sides always have exactly one.
void extract_material(EvalContext *ctx, float *features) {
	static const int SLOTS[KING] = {FEATURE_MATERIAL_PAWN, FEATURE_MATERIAL_KNIGHT,
	                                FEATURE_MATERIAL_BISHOP, FEATURE_MATERIAL_ROOK,
	                                FEATURE_MATERIAL_QUEEN};
	const Position *pos = ctx->pos;
	for (Role role = PAWN; role < KING; role++) {
		int ours = bb_count(pos->roles[role] & pos->colors[ctx->us]);
		int theirs = bb_count(pos->roles[role] & pos->colors[ctx->them]);
		features[SLOTS[role]] = (float)(ours - theirs);
	}
}
