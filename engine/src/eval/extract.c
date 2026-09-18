#include "eval.h"
#include "families.h"
#include "feature_ids.h"
#include "position.h"

void extract_features(const Position *pos, float *features) {
	for (int slot = 0; slot < FEATURE_COUNT; slot++) {
		features[slot] = 0;
	}
	EvalContext ctx = eval_context(pos);
	extract_material(&ctx, features);
	extract_placement(&ctx, features);
	extract_king(&ctx, features);
}
