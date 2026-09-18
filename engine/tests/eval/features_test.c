#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "bitboard.h"
#include "eval.h"
#include "feature_ids.h"
#include "harness.h"
#include "move.h"
#include "position.h"

static uint32_t bits_of(float value) {
	uint32_t bits = 0;
	memcpy(&bits, &value, sizeof bits);
	return bits;
}

// One line of `fixtures/features.txt`: the position a move was played from, the move (`-` at a
// root) and the features of the position after, as float32 bits — the TS extractor's, frozen
// when it was retired.
static void check_line(char *line) {
	char *uci = strchr(line, ';');
	char *values = uci == NULL ? NULL : strchr(uci + 1, ';');
	CHECK(values != NULL);
	if (values == NULL) {
		return;
	}
	*uci++ = '\0';
	*values++ = '\0';
	Position pos;
	CHECK(position_from_fen(&pos, line));
	Move move = MOVE_NONE;
	Undo undo;
	Played played = {.move = MOVE_NONE, .captured = NO_ROLE};
	bool root = strcmp(uci, "-") == 0;
	CHECK(root || move_from_uci(uci, &move));
	if (!root) {
		played = played_move(&pos, move);
		position_make(&pos, move, &undo);
	}
	uint32_t expected[FEATURE_COUNT];
	for (int slot = 0; slot < FEATURE_COUNT; slot++) {
		expected[slot] = (uint32_t)strtoul(values, &values, 16);
	}
	float features[FEATURE_COUNT];
	extract_features(&pos, root ? NULL : &played, features);
	for (int slot = 0; slot < FEATURE_COUNT; slot++) {
		CHECK(bits_of(features[slot]) == expected[slot]);
	}
}

// Every slot of every line, the move features included: a change to what a feature reads fails
// here, down to the last bit, until the fixture is changed with it.
TEST(features_equal_the_frozen_fixture_to_the_bit) {
	static char line[1024];
	FILE *file = fopen("tests/fixtures/features.txt", "r");
	CHECK(file != NULL);
	int count = 0;
	while (file != NULL && fgets(line, sizeof line, file) != NULL) {
		check_line(line);
		count++;
	}
	CHECK(count > 2000);
	(void)(file != NULL && fclose(file));
}
