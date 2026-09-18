#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#include "draw.h"
#include "evaluate.h"
#include "feature_ids.h"
#include "harness.h"
#include "move.h"
#include "movegen.h"
#include "position.h"
#include "search.h"

static History history;
static Search search;

// Classical material in centipawns, with mate as a preference of `gives_mate`.
static const float *material(float gives_mate) {
	static float weights[FEATURE_COUNT];
	for (int slot = 0; slot < FEATURE_COUNT; slot++) {
		weights[slot] = 0;
	}
	weights[FEATURE_MATERIAL_PAWN] = 100;
	weights[FEATURE_MATERIAL_KNIGHT] = 300;
	weights[FEATURE_MATERIAL_BISHOP] = 300;
	weights[FEATURE_MATERIAL_ROOK] = 500;
	weights[FEATURE_MATERIAL_QUEEN] = 900;
	weights[FEATURE_GIVES_MATE] = gives_mate;
	return weights;
}

static SearchResult run(const char *fen, const float *weights, int depth, bool quiescence) {
	Position pos;
	CHECK(position_from_fen(&pos, fen));
	history.length = 0;
	search_init(&search,
	            (SearchConfig){.weights = weights, .history = &history, .quiescence = quiescence});
	return search_root(&search, &pos, depth, NULL);
}

static bool plays(SearchResult result, const char *uci) {
	char written[UCI_MAX];
	move_to_uci(result.best, written);
	return result.best != MOVE_NONE && strcmp(written, uci) == 0;
}

static bool mates_in(const char *fen, int moves, const char *first, const char *second) {
	SearchResult result = run(fen, material(1), 2 * moves - 1, false);
	bool move = plays(result, first) || (second != NULL && plays(result, second));
	return move && result.score == (double)(MATE_SCORE - (2 * moves - 1));
}

// Every mate here was proved shortest by a brute-force search over chessops's legal moves.
TEST(finds_each_mate_at_its_distance) {
	CHECK(mates_in("6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1", 1, "a1a8", NULL));
	CHECK(mates_in("k7/8/8/3K4/8/8/8/1Q6 w - - 0 1", 2, "d5c6", NULL));
	CHECK(mates_in("1q6/8/8/8/3k4/8/8/K7 b - - 0 1", 2, "d4c3", NULL));
	CHECK(mates_in("k7/8/8/8/2K5/8/8/1Q6 w - - 0 1", 3, "c4c5", "c4d5"));
}

// The bug the decay exists for: a slower mate must not outbid a faster one.
TEST(prefers_the_shortest_mate) {
	SearchResult result = run("6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1", material(1), 3, false);
	CHECK(plays(result, "a1a8") && result.score == (double)(MATE_SCORE - 1));
}

TEST(flees_mate_with_the_preference_flipped) {
	SearchResult result = run("6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1", material(-1), 1, false);
	CHECK(!plays(result, "a1a8") && result.score == 200);
}

TEST(scores_the_game_over_at_the_root) {
	SearchResult mated = run("R5k1/5ppp/8/8/8/8/8/6K1 b - - 0 1", material(1), 2, false);
	CHECK(mated.best == MOVE_NONE && mated.score == -(double)MATE_SCORE);
	SearchResult stalemated = run("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1", material(1), 2, false);
	CHECK(stalemated.best == MOVE_NONE && stalemated.score == 0);
}

// A queen up, every king move and most queen moves keep Black boxed in — stalemate, which reads 0
// rather than the queen. The first generated move is one of them, so the test fails if the rule
// does.
TEST(scores_stalemate_in_the_tree_as_a_draw) {
	SearchResult result = run("7k/5Q2/8/6K1/8/8/8/8 w - - 0 1", material(1), 1, false);
	CHECK(result.score == 900);
	Position pos;
	Undo undo;
	Move moves[MAX_MOVES];
	CHECK(position_from_fen(&pos, "7k/5Q2/8/6K1/8/8/8/8 w - - 0 1"));
	position_make(&pos, result.best, &undo);
	CHECK(generate_moves(&pos, moves) > 0);
}

TEST(scores_each_draw_rule_as_zero) {
	CHECK(run("4k3/8/8/8/8/8/8/R3K3 w - - 99 80", material(1), 1, false).score == 0);
	CHECK(run("4k3/8/8/8/8/8/8/4KN2 w - - 0 1", material(1), 2, false).score == 0);
}

// A rook down, Black takes the one move back into a position the game has already stood in.
TEST(steers_into_a_repetition_when_it_is_losing) {
	Position pos;
	Undo undo;
	CHECK(position_from_fen(&pos, "4k3/8/8/8/8/8/8/R3K3 b - - 10 20"));
	Move move = MOVE_NONE;
	CHECK(move_from_uci("e8d7", &move));
	search_init(&search,
	            (SearchConfig){.weights = material(1), .history = &history, .quiescence = false});
	history.length = 0;
	position_make(&pos, move, &undo);
	history_push(&history, pos.hash);
	position_unmake(&pos, move, &undo);
	history_push(&history, 1);
	history_push(&history, 2);
	SearchResult result = search_root(&search, &pos, 1, NULL);
	CHECK(result.best == move && result.score == 0);
}
