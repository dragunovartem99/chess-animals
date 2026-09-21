#include "feature_ids.h"
#include "harness.h"
#include "probe.h"

static const char *const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

TEST(centralization_is_level_in_the_symmetric_opening) {
	CHECK(feature_at(START, FEATURE_CENTRALIZATION) == 0);
}

TEST(centralization_scores_the_four_central_squares_highest_and_the_rim_lowest) {
	CHECK(feature_at("4k3/8/8/8/3N4/8/8/4K3 w - - 0 1", FEATURE_CENTRALIZATION) == 6);
	CHECK(feature_at("4k3/8/8/8/8/8/8/N3K3 w - - 0 1", FEATURE_CENTRALIZATION) == 0);
}

TEST(centralization_counts_minor_and_major_pieces_but_not_the_king_or_pawns) {
	CHECK(feature_at("4k3/8/8/8/3P4/8/8/4K3 w - - 0 1", FEATURE_CENTRALIZATION) == 0);
	CHECK(feature_at("8/8/8/8/k7/8/8/6K1 w - - 0 1", FEATURE_CENTRALIZATION) == 0);
}

TEST(centralization_reads_the_same_for_both_colors) {
	CHECK(feature_at("4k3/8/8/8/3N4/8/8/4K3 w - - 0 1", FEATURE_CENTRALIZATION) ==
	      feature_at("4k3/8/8/3n4/8/8/8/4K3 b - - 0 1", FEATURE_CENTRALIZATION));
}

TEST(development_is_level_in_the_opening) { CHECK(feature_at(START, FEATURE_DEVELOPMENT) == 0); }

// White has a knight and a bishop out (2); Black only one knight (1); Black to move.
TEST(development_counts_our_minors_off_the_back_rank_minus_theirs) {
	const char *fen = "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R b KQkq - 0 4";
	CHECK(feature_at(fen, FEATURE_DEVELOPMENT) == -1);
}

TEST(development_ignores_rooks_queens_kings_and_pawns) {
	CHECK(feature_at("4k3/8/8/8/3P4/Q7/8/R3K2R w KQ - 0 1", FEATURE_DEVELOPMENT) == 0);
}

TEST(development_flips_sign_with_the_side_to_move) {
	const char *white = "rnbqkbnr/pppp1ppp/8/4p3/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 1 2";
	const char *black = "rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2";
	CHECK(feature_at(white, FEATURE_DEVELOPMENT) == -1);
	CHECK(feature_at(black, FEATURE_DEVELOPMENT) == -1);
}

TEST(early_queen_is_zero_in_the_opening) { CHECK(feature_at(START, FEATURE_EARLY_QUEEN) == 0); }

// Black queen on h4, all four black minors still home; White to move.
TEST(early_queen_counts_the_minors_left_at_home_behind_a_queen_already_out) {
	const char *fen = "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3";
	CHECK(feature_at(fen, FEATURE_EARLY_QUEEN) == -4);
}

TEST(early_queen_is_zero_once_the_queen_is_traded_off) {
	const char *fen = "rnb1kbnr/pppp1ppp/8/4p3/8/8/PPPP1PPP/RNB1KBNR w KQkq - 0 3";
	CHECK(feature_at(fen, FEATURE_EARLY_QUEEN) == 0);
}

TEST(early_queen_is_zero_once_the_minors_behind_it_have_developed) {
	const char *fen = "r3k2r/ppp2ppp/2npbn2/4p2q/6P1/2NPBN2/PPP2P1P/R2QK2R w KQkq - 0 1";
	CHECK(feature_at(fen, FEATURE_EARLY_QUEEN) == 0);
}
