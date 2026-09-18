#ifndef ENGINE_EVAL_FAMILIES_H
#define ENGINE_EVAL_FAMILIES_H

#include "eval.h"

// One per TS family, each writing only its own slots — `extract_features` calls them in the TS
// extractor's order.
void extract_material(EvalContext *ctx, float *features);
void extract_placement(EvalContext *ctx, float *features);
void extract_king(EvalContext *ctx, float *features);
void extract_mobility(EvalContext *ctx, float *features);
void extract_control(EvalContext *ctx, float *features);
void extract_proximity(EvalContext *ctx, float *features);
void extract_symmetry(EvalContext *ctx, float *features);
void extract_aggression(EvalContext *ctx, float *features);

#endif
