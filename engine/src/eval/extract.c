#include "eval.h"
#include "families.h"
#include "feature_ids.h"
#include "position.h"

void extract_features(const Position *pos, const Played *played, float *features) {
	for (int slot = 0; slot < FEATURE_COUNT; slot++) {
		features[slot] = 0;
	}
	EvalContext ctx = eval_context(pos);
	extract_material(&ctx, features);
	extract_placement(&ctx, features);
	extract_king(&ctx, features);
	extract_mobility(&ctx, features);
	extract_control(&ctx, features);
	extract_proximity(&ctx, features);
	extract_symmetry(&ctx, features);
	extract_aggression(&ctx, features);
	extract_endgame(&ctx, features);
	extract_move(pos, played, features);
}
