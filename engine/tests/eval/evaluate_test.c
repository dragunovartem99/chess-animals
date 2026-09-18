#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "bitboard.h"
#include "corpus.h"
#include "eval.h"
#include "evaluate.h"
#include "feature_ids.h"
#include "harness.h"
#include "move.h"
#include "position.h"

enum { MAX_BOTS = 64 };

static CorpusBot roster[MAX_BOTS];
static int bots;

static uint64_t bits_of(double value) {
	uint64_t bits = 0;
	memcpy(&bits, &value, sizeof bits);
	return bits;
}

// `<parent>;<uci or ->;<scores>`: the position after the move, scored by every animal in turn.
static void check_sample(char *line) {
	char *uci = strchr(line, ';');
	*uci++ = '\0';
	char *scores = strchr(uci, ';');
	*scores++ = '\0';
	Position pos;
	CHECK(position_from_fen(&pos, line));
	Played played = {.move = MOVE_NONE, .captured = NO_ROLE};
	bool root = strcmp(uci, "-") == 0;
	if (!root) {
		Undo undo;
		CHECK(move_from_uci(uci, &played.move));
		played = played_move(&pos, played.move);
		position_make(&pos, played.move, &undo);
	}
	for (int bot = 0; bot < bots; bot++) {
		Evaluator eval = evaluator(roster[bot].weights);
		uint64_t expected = strtoull(scores, &scores, 16);
		CHECK(bits_of(evaluate(&eval, &pos, root ? NULL : &played, 0)) == expected);
	}
}

// Every animal on the roster, on every sample, mates included: a position scores exactly what the
// frozen fixture says, down to the last bit of the double.
TEST(evaluate_equals_the_frozen_scores_for_every_roster_bot) {
	static char line[8192];
	FILE *file = fopen("tests/fixtures/evals.txt", "r");
	CHECK(file != NULL);
	int samples = 0;
	bots = corpus_bots(roster, MAX_BOTS);
	while (file != NULL && fgets(line, sizeof line, file) != NULL) {
		if (strncmp(line, "bot;", 4) != 0) {
			check_sample(line);
			samples++;
		}
	}
	CHECK(bots > 20 && samples > 800);
	(void)(file != NULL && fclose(file));
}

static bool terminal(const char *fen, float preference, int ply, double *score) {
	float bot[FEATURE_COUNT] = {0};
	bot[FEATURE_GIVES_MATE] = preference;
	Position pos;
	CHECK(position_from_fen(&pos, fen));
	return terminal_score(&pos, bot, ply, score);
}

// Black is mated: White's rook on a8, the king boxed in by its own pawns.
static const char *const MATED = "R5k1/5ppp/8/8/8/8/8/6K1 b - - 0 1";

TEST(scores_mate_from_the_mated_side_signed_by_the_preference) {
	double score = 0;
	CHECK(terminal(MATED, 1, 0, &score) && score == -(double)MATE_SCORE);
	CHECK(terminal(MATED, -1, 0, &score) && score == (double)MATE_SCORE);
	CHECK(terminal(MATED, 1, 3, &score) && score == -(double)(MATE_SCORE - 3));
}

// A bot with no opinion on mate evaluates the mated position like any other, and neither
// stalemate nor a quiet position is terminal at all.
TEST(leaves_everything_else_to_the_evaluation) {
	double score = 7;
	CHECK(!terminal(MATED, 0, 0, &score));
	CHECK(!terminal("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1", 1, 0, &score));
	CHECK(!terminal("6k1/5ppp/8/8/8/8/5PPP/R5K1 b - - 0 1", 1, 0, &score));
	CHECK(score == 7);
}

TEST(walks_only_the_weighted_slots) {
	float bot[FEATURE_COUNT] = {0};
	bot[FEATURE_MATERIAL_PAWN] = 1;
	bot[FEATURE_MATERIAL_QUEEN] = 9;
	Evaluator eval = evaluator(bot);
	CHECK(eval.count == 2);
	CHECK(eval.slots[0] == FEATURE_MATERIAL_PAWN && eval.slots[1] == FEATURE_MATERIAL_QUEEN);
	CHECK(eval.extractors[0] == EXTRACTORS[FEATURE_MATERIAL_PAWN] &&
	      eval.extractors[1] == EXTRACTORS[FEATURE_MATERIAL_QUEEN]);
	// Two pawns up, a queen down and a rook up: the rook is not weighed, so it is not counted.
	Position pos;
	CHECK(position_from_fen(&pos, "3qk3/8/8/8/8/8/PP6/R3K3 w - - 0 1"));
	CHECK(evaluate_features(&eval, &pos, NULL) == -7);
}
