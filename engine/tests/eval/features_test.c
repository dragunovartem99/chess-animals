#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "eval.h"
#include "feature_ids.h"
#include "harness.h"
#include "move.h"
#include "position.h"

// The slots whose family has been ported. A family's commit appends its slots here, and from
// then on every one of them must equal the TS extractor's to the bit.
static const int PORTED[] = {
    FEATURE_MATERIAL_PAWN, FEATURE_MATERIAL_KNIGHT, FEATURE_MATERIAL_BISHOP,
    FEATURE_MATERIAL_ROOK, FEATURE_MATERIAL_QUEEN,  FEATURE_CENTRALIZATION,
    FEATURE_DEVELOPMENT,   FEATURE_EARLY_QUEEN,     FEATURE_CASTLED,
    FEATURE_KING_DANGER,   FEATURE_MOBILITY,        FEATURE_CENTER_CONTROL,
    FEATURE_SPACE,         FEATURE_HANGING,         FEATURE_SWARM,
    FEATURE_HUDDLE,        FEATURE_KING_PROXIMITY,  FEATURE_SAME_COLOR_SQUARES,
    FEATURE_MIRROR_RANKS};

static uint32_t bits_of(float value) {
	uint32_t bits = 0;
	memcpy(&bits, &value, sizeof bits);
	return bits;
}

// One line of `fixtures/features.txt`: the position a move was played from, the move (`-` at a
// root) and the TS extractor's features for the position after, as float32 bits.
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
	if (strcmp(uci, "-") != 0 && move_from_uci(uci, &move)) {
		position_make(&pos, move, &undo);
	}
	uint32_t expected[FEATURE_COUNT];
	for (int slot = 0; slot < FEATURE_COUNT; slot++) {
		expected[slot] = (uint32_t)strtoul(values, &values, 16);
	}
	float features[FEATURE_COUNT];
	extract_features(&pos, features);
	for (size_t index = 0; index < sizeof PORTED / sizeof PORTED[0]; index++) {
		CHECK(bits_of(features[PORTED[index]]) == expected[PORTED[index]]);
	}
}

TEST(ported_features_equal_the_ts_extractor_to_the_bit) {
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
