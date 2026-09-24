#include "feature_ids.h"
#include "harness.h"
#include "probe.h"

TEST(move_features_read_zero_at_a_root) {
	const char *fen = "4k3/8/8/8/8/8/8/4K2R w K - 0 1";
	CHECK(feature_at(fen, FEATURE_GIVES_CHECK) == 0);
	CHECK(feature_at(fen, FEATURE_CAPTURE_VALUE) == 0);
}

// Negative in the child, so a positive weight makes the mover want it.
TEST(gives_check_is_negative_in_the_child) {
	CHECK(feature_after("4k3/8/8/8/8/8/8/4K2R w K - 0 1", "h1h2", FEATURE_GIVES_CHECK) == 0);
	CHECK(feature_after("4k3/8/8/8/8/8/8/R3K3 w Q - 0 1", "a1a8", FEATURE_GIVES_CHECK) == -1);
}

// A mate is also a check, and the extractor no longer asks which: a mated position never reaches
// extraction, because `terminal_score` has already scored it.
TEST(gives_check_reads_on_a_mating_move_too) {
	CHECK(feature_after("6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1", "a1a8", FEATURE_GIVES_CHECK) == -1);
}

TEST(capture_value_prices_the_piece_taken) {
	CHECK(feature_after("4k3/8/8/8/8/4K3/8/r6R w - - 0 1", "h1a1", FEATURE_CAPTURE_VALUE) == -5);
}

TEST(capture_value_is_zero_for_a_quiet_move) {
	CHECK(feature_after("4k3/8/8/8/8/8/8/4K2R w K - 0 1", "h1h2", FEATURE_CAPTURE_VALUE) == 0);
}

// Castling is the king stepping onto its own rook, as chessops spells it: a move, not a capture.
TEST(capture_value_is_zero_for_castling_onto_its_own_rook) {
	CHECK(feature_after("4k3/8/8/8/8/8/8/4K2R w K - 0 1", "e1h1", FEATURE_CAPTURE_VALUE) == 0);
	CHECK(feature_after("r3k3/8/8/8/8/8/8/4K3 b q - 0 1", "e8a8", FEATURE_CAPTURE_VALUE) == 0);
}

TEST(capture_value_sees_the_pawn_en_passant_takes_from_a_square_the_move_never_names) {
	CHECK(feature_after("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2", "e5d6", FEATURE_CAPTURE_VALUE) == -1);
}
