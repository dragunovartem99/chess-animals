#include <string.h>

#include "bitboard.h"
#include "harness.h"
#include "move.h"

static void check_uci(const char *uci, Square from, Square to, Role promotion) {
	Move move = MOVE_NONE;
	char out[UCI_MAX];
	CHECK(move_from_uci(uci, &move));
	CHECK(move_from(move) == from && move_to(move) == to && move_promotion(move) == promotion);
	move_to_uci(move, out);
	CHECK(strcmp(out, uci) == 0);
}

TEST(reads_and_writes_uci) {
	check_uci("e2e4", 12, 28, PAWN);
	check_uci("h7h8q", 55, 63, QUEEN);
	check_uci("a2a1n", 8, 0, KNIGHT);
	check_uci("b7b8r", 49, 57, ROOK);
	check_uci("g2g1b", 14, 6, BISHOP);
	check_uci("e1h1", 4, 7, PAWN);
}

TEST(rejects_malformed_uci) {
	static const char *const BAD[] = {"", "e2", "i2e4", "e9e4", "e2e4k", "e2e4p", "e7e8qq"};
	for (size_t index = 0; index < sizeof BAD / sizeof BAD[0]; index++) {
		Move move = MOVE_NONE;
		CHECK(!move_from_uci(BAD[index], &move));
	}
}
