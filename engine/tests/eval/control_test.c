#include "feature_ids.h"
#include "harness.h"
#include "probe.h"

static const char *const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

TEST(center_control_is_level_in_the_symmetric_opening) {
	CHECK(feature_at(START, FEATURE_CENTER_CONTROL) == 0);
}

TEST(center_control_rewards_a_piece_that_eyes_the_middle) {
	CHECK(feature_at("4k3/8/8/8/8/2N5/8/4K3 w - - 0 1", FEATURE_CENTER_CONTROL) == 2);
}

TEST(center_control_is_zero_for_a_piece_that_reaches_none_of_the_four_squares) {
	CHECK(feature_at("4k3/8/8/8/8/8/8/N3K3 w - - 0 1", FEATURE_CENTER_CONTROL) == 0);
}

TEST(space_is_level_in_the_symmetric_opening) { CHECK(feature_at(START, FEATURE_SPACE) == 0); }

TEST(space_counts_only_what_a_side_reaches_on_the_far_half) {
	float advanced = feature_at("4k3/8/8/3N4/8/8/8/4K3 w - - 0 1", FEATURE_SPACE);
	float at_home = feature_at("4k3/8/8/8/8/8/8/3NK3 w - - 0 1", FEATURE_SPACE);
	CHECK(advanced > at_home);
}

TEST(hanging_is_zero_when_nothing_is_loose) { CHECK(feature_at(START, FEATURE_HANGING) == 0); }

// The knight on d5 is attacked by the rook and defended by nothing: ours when Black moves, the
// opponent's — the mirror image — when White does.
TEST(hanging_counts_our_loose_pieces_and_reads_theirs_as_the_mirror) {
	CHECK(feature_at("4k3/8/8/3n4/8/3R4/8/4K3 b - - 0 1", FEATURE_HANGING) == 1);
	CHECK(feature_at("4k3/8/8/3n4/8/3R4/8/4K3 w - - 0 1", FEATURE_HANGING) == -1);
}

TEST(hanging_skips_a_piece_its_own_side_defends) {
	CHECK(feature_at("4k3/3q4/8/3n4/8/3R4/8/4K3 w - - 0 1", FEATURE_HANGING) == 0);
}

TEST(hanging_never_counts_a_king) {
	CHECK(feature_at("4k3/8/8/8/8/8/8/4KR2 w - - 0 1", FEATURE_HANGING) == 0);
}
