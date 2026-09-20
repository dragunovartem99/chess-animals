#include "feature_ids.h"
#include "harness.h"
#include "probe.h"

static const char *const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

TEST(king_activity_is_silent_with_every_piece_on_the_board) {
	CHECK(feature_at(START, FEATURE_KING_ACTIVITY) == 0);
}

TEST(king_activity_is_level_with_both_kings_equally_central) {
	CHECK(feature_at("8/8/5k2/8/8/2K5/8/8 w - - 0 1", FEATURE_KING_ACTIVITY) == 0);
}

// White king on d4 (centrality 6), Black's on a1 (0).
TEST(king_activity_scores_a_central_king_over_a_cornered_one_from_either_seat) {
	CHECK(feature_at("8/8/8/8/3K4/8/8/k7 w - - 0 1", FEATURE_KING_ACTIVITY) == 6);
	CHECK(feature_at("8/8/8/8/3K4/8/8/k7 b - - 0 1", FEATURE_KING_ACTIVITY) == -6);
}

// Two rooks still on: phase 4/24, so (5/6)² of the bare-ending value.
TEST(king_activity_fades_in_as_the_square_of_what_has_come_off) {
	float value = feature_at("r7/8/8/8/3K4/8/7R/k7 w - - 0 1", FEATURE_KING_ACTIVITY);
	CHECK(near(value, 6 * (5.0F / 6) * (5.0F / 6)));
}

// Rooks and minors all on, queens off: phase 16/24, a ninth of the value rather than a third.
TEST(king_activity_stays_near_silent_after_only_a_queen_trade) {
	CHECK(feature_at("rnb1kbnr/8/8/8/3K4/8/8/RNB2BNR w - - 0 1", FEATURE_KING_ACTIVITY) < 1);
}

TEST(passed_pawn_push_is_silent_with_every_piece_on_the_board) {
	CHECK(feature_at(START, FEATURE_PASSED_PAWN_PUSH) == 0);
}

// A white pawn on d7, six ranks from home, nothing to stop it.
TEST(passed_pawn_push_scores_a_passer_by_how_far_it_has_run_from_either_seat) {
	CHECK(feature_at("7k/3P4/8/8/8/8/8/4K3 w - - 0 1", FEATURE_PASSED_PAWN_PUSH) == 6);
	CHECK(feature_at("7k/3P4/8/8/8/8/8/4K3 b - - 0 1", FEATURE_PASSED_PAWN_PUSH) == -6);
}

TEST(passed_pawn_push_ignores_pawns_blocked_or_guarded_on_their_path) {
	CHECK(feature_at("4k3/8/8/3p4/3P4/8/8/4K3 w - - 0 1", FEATURE_PASSED_PAWN_PUSH) == 0);
	CHECK(feature_at("4k3/8/2p5/8/3P4/8/8/4K3 w - - 0 1", FEATURE_PASSED_PAWN_PUSH) == 0);
}

// Two rooks still on, so five sixths of the d7 passer's six.
TEST(passed_pawn_push_fades_in_as_material_comes_off) {
	CHECK(near(feature_at("r6k/3P4/8/8/8/8/1R6/4K3 w - - 0 1", FEATURE_PASSED_PAWN_PUSH), 5));
}
