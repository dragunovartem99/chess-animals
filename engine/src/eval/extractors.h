#ifndef ENGINE_EVAL_EXTRACTORS_H
#define ENGINE_EVAL_EXTRACTORS_H

#include "eval.h"

// One function per registry entry, grouped in files by what they read — the grouping is for the
// reader; `EXTRACTORS` is what the evaluator sees.
float extract_material_pawn(EvalContext *ctx);
float extract_material_knight(EvalContext *ctx);
float extract_material_bishop(EvalContext *ctx);
float extract_material_rook(EvalContext *ctx);
float extract_material_queen(EvalContext *ctx);
float extract_king_danger(EvalContext *ctx);
float extract_swarm(EvalContext *ctx);
float extract_huddle(EvalContext *ctx);
float extract_king_proximity(EvalContext *ctx);
float extract_same_color_squares(EvalContext *ctx);
float extract_mirror_ranks(EvalContext *ctx);
float extract_opponent_mobility(EvalContext *ctx);
float extract_push_depth(EvalContext *ctx);
float extract_offered_material(EvalContext *ctx);
float extract_gives_mate(EvalContext *ctx);
float extract_gives_check(EvalContext *ctx);
float extract_capture_value(EvalContext *ctx);
float extract_center_control(EvalContext *ctx);
float extract_space(EvalContext *ctx);
float extract_hanging(EvalContext *ctx);
float extract_mobility(EvalContext *ctx);
float extract_centralization(EvalContext *ctx);
float extract_development(EvalContext *ctx);
float extract_early_queen(EvalContext *ctx);
float extract_castled(EvalContext *ctx);
float extract_king_activity(EvalContext *ctx);
float extract_passed_pawn_push(EvalContext *ctx);

// A count per side, taken as ours minus theirs — the shape most features share.
typedef int (*SideCount)(EvalContext *ctx, Color color);

static inline float side_difference(EvalContext *ctx, SideCount count) {
	return (float)(count(ctx, ctx->us) - count(ctx, ctx->them));
}

#endif
