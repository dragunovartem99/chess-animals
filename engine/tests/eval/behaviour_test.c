#include "feature_ids.h"
#include "harness.h"
#include "probe.h"

static const char *const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// White's rook is on h1, a light square. Black's king is on g8, also light, so it does not count
// for Black, whose color is dark.
TEST(same_color_squares_counts_our_pieces_on_squares_of_our_own_color) {
	CHECK(feature_at("6k1/8/8/8/8/8/8/K6R w - - 0 1", FEATURE_SAME_COLOR_SQUARES) == 1);
	CHECK(feature_at("6k1/8/8/8/8/8/8/K7 w - - 0 1", FEATURE_SAME_COLOR_SQUARES) == 0);
}

TEST(mirror_ranks_scores_the_opening_as_perfectly_mirrored) {
	CHECK(near(feature_at(START, FEATURE_MIRROR_RANKS), 0));
}

TEST(mirror_ranks_penalises_a_board_that_has_lost_its_mirror) {
	const char *fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBN1 w Qkq - 0 1";
	CHECK(feature_at(fen, FEATURE_MIRROR_RANKS) < 0);
}

TEST(mirror_ranks_reads_the_same_for_both_sides) {
	CHECK(feature_at("r3k3/8/8/8/8/8/8/4K2R w Kq - 0 1", FEATURE_MIRROR_RANKS) ==
	      feature_at("r3k3/8/8/8/8/8/8/4K2R b Kq - 0 1", FEATURE_MIRROR_RANKS));
}

TEST(opponent_mobility_counts_what_the_other_side_can_reach_and_nothing_of_ours) {
	float boxed_in = feature_at("7k/8/8/8/8/8/8/K7 w - - 0 1", FEATURE_OPPONENT_MOBILITY);
	float active = feature_at("7k/8/8/3q4/8/8/8/K7 w - - 0 1", FEATURE_OPPONENT_MOBILITY);
	CHECK(active > boxed_in);
}

TEST(push_depth_ignores_everything_short_of_the_halfway_line) {
	CHECK(feature_at("4k3/8/8/8/8/8/3R4/4K3 w - - 0 1", FEATURE_PUSH_DEPTH) == 0);
}

TEST(push_depth_grows_the_deeper_a_piece_goes) {
	CHECK(feature_at("4k3/8/8/3R4/8/8/8/4K3 w - - 0 1", FEATURE_PUSH_DEPTH) == 1);
	CHECK(feature_at("4k3/3R4/8/8/8/8/8/4K3 w - - 0 1", FEATURE_PUSH_DEPTH) == 3);
}

TEST(offered_material_is_zero_when_nothing_of_ours_is_attacked) {
	CHECK(feature_at("4k3/8/8/8/8/8/8/4K2R w - - 0 1", FEATURE_OFFERED_MATERIAL) == 0);
}

TEST(offered_material_prices_what_the_opponent_can_take_from_us) {
	CHECK(feature_at("4k3/8/8/8/8/4K3/8/1q4N1 w - - 0 1", FEATURE_OFFERED_MATERIAL) == 3);
}

TEST(offered_material_counts_a_piece_once_for_every_way_it_can_be_taken) {
	CHECK(feature_at("4k1r1/8/8/8/8/4K3/8/1q4N1 w - - 0 1", FEATURE_OFFERED_MATERIAL) == 6);
}
