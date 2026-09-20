#include "feature_ids.h"
#include "harness.h"
#include "probe.h"

static const char *const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

TEST(king_danger_is_level_in_the_opening) { CHECK(feature_at(START, FEATURE_KING_DANGER) == 0); }

TEST(king_danger_weights_a_queen_near_the_king_far_above_a_knight) {
	float queen = feature_at("6k1/8/8/8/8/5q2/8/6K1 b - - 0 1", FEATURE_KING_DANGER);
	float knight = feature_at("6k1/8/8/8/8/4n3/8/6K1 b - - 0 1", FEATURE_KING_DANGER);
	CHECK(queen == -5);
	CHECK(knight == -2);
}

// Our own king's attackers count too, which a negative weight then punishes.
TEST(king_danger_counts_our_own_kings_attackers) {
	CHECK(feature_at("6k1/8/8/8/8/5q2/8/6K1 w - - 0 1", FEATURE_KING_DANGER) == 5);
}

TEST(king_danger_ignores_a_piece_that_reaches_nowhere_near_the_king) {
	CHECK(feature_at("6k1/8/8/8/8/8/8/n5K1 b - - 0 1", FEATURE_KING_DANGER) == 0);
}

TEST(swarm_is_level_in_the_symmetric_opening) { CHECK(feature_at(START, FEATURE_SWARM) == 0); }

TEST(swarm_rises_as_our_pieces_close_on_the_enemy_king) {
	float far = feature_at("7k/8/8/8/8/8/8/R3K3 w - - 0 1", FEATURE_SWARM);
	float near_by = feature_at("7k/6R1/8/8/8/8/8/4K3 w - - 0 1", FEATURE_SWARM);
	CHECK(near_by > far);
}

TEST(huddle_rises_as_our_pieces_gather_around_our_own_king) {
	float scattered = feature_at("7k/8/8/8/8/8/8/R3K3 w - - 0 1", FEATURE_HUDDLE);
	float gathered = feature_at("7k/8/8/8/8/8/8/3RK3 w - - 0 1", FEATURE_HUDDLE);
	CHECK(gathered > scattered);
}

TEST(king_proximity_is_the_negated_distance_between_the_kings_from_either_side) {
	CHECK(feature_at("7k/8/8/8/8/8/8/K7 w - - 0 1", FEATURE_KING_PROXIMITY) == -7);
	CHECK(feature_at("7k/8/8/8/8/8/8/K7 b - - 0 1", FEATURE_KING_PROXIMITY) == -7);
	CHECK(feature_at("8/8/3k4/8/3K4/8/8/8 w - - 0 1", FEATURE_KING_PROXIMITY) == -2);
}
