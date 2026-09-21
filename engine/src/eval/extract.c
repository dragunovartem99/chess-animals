#include "eval.h"
#include "extractors.h"
#include "feature_ids.h"
#include "position.h"

// Indexed by slot, so the order is the registry's and a new feature cannot land in the wrong one.
const Extractor EXTRACTORS[FEATURE_COUNT] = {
    [FEATURE_MATERIAL_PAWN] = extract_material_pawn,
    [FEATURE_MATERIAL_KNIGHT] = extract_material_knight,
    [FEATURE_MATERIAL_BISHOP] = extract_material_bishop,
    [FEATURE_MATERIAL_ROOK] = extract_material_rook,
    [FEATURE_MATERIAL_QUEEN] = extract_material_queen,
    [FEATURE_KING_DANGER] = extract_king_danger,
    [FEATURE_SWARM] = extract_swarm,
    [FEATURE_HUDDLE] = extract_huddle,
    [FEATURE_KING_PROXIMITY] = extract_king_proximity,
    [FEATURE_SAME_COLOR_SQUARES] = extract_same_color_squares,
    [FEATURE_MIRROR_RANKS] = extract_mirror_ranks,
    [FEATURE_OPPONENT_MOBILITY] = extract_opponent_mobility,
    [FEATURE_PUSH_DEPTH] = extract_push_depth,
    [FEATURE_OFFERED_MATERIAL] = extract_offered_material,
    [FEATURE_GIVES_MATE] = extract_gives_mate,
    [FEATURE_GIVES_CHECK] = extract_gives_check,
    [FEATURE_CAPTURE_VALUE] = extract_capture_value,
    [FEATURE_CENTER_CONTROL] = extract_center_control,
    [FEATURE_SPACE] = extract_space,
    [FEATURE_HANGING] = extract_hanging,
    [FEATURE_MOBILITY] = extract_mobility,
    [FEATURE_CENTRALIZATION] = extract_centralization,
    [FEATURE_DEVELOPMENT] = extract_development,
    [FEATURE_EARLY_QUEEN] = extract_early_queen,
    [FEATURE_KING_ACTIVITY] = extract_king_activity,
    [FEATURE_PASSED_PAWN_PUSH] = extract_passed_pawn_push,
};

void extract_features(const Position *pos, const Played *played, float *features) {
	EvalContext ctx = eval_context(pos, played);
	for (int slot = 0; slot < FEATURE_COUNT; slot++) {
		features[slot] = EXTRACTORS[slot](&ctx);
	}
}
