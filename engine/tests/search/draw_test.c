#include <stdbool.h>
#include <stdio.h>
#include <string.h>

#include "draw.h"
#include "harness.h"
#include "move.h"
#include "position.h"

static const char *const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// Replays one game of `fixtures/draws.txt` as `runGame` plays it — push, then make — and checks
// every position's verdict against the flag `createDrawTest` gave it.
static int check_game(char *moves, const char *flags) {
	static History history;
	Position pos;
	history.length = 0;
	CHECK(position_from_fen(&pos, START));
	int ply = 0;
	for (char *uci = strtok(moves, " "); uci != NULL; uci = strtok(NULL, " "), ply++) {
		Move move = MOVE_NONE;
		Undo undo;
		CHECK(move_from_uci(uci, &move));
		history_push(&history, pos.hash);
		position_make(&pos, move, &undo);
		CHECK(position_drawn(&pos, &history) == (flags[ply] == '1'));
	}
	return ply;
}

TEST(agrees_with_create_draw_test_on_the_fixture) {
	static char line[8192];
	FILE *file = fopen("tests/fixtures/draws.txt", "r");
	CHECK(file != NULL);
	int positions = 0;
	while (file != NULL && fgets(line, sizeof line, file) != NULL) {
		char *flags = strchr(line, ';');
		CHECK(flags != NULL);
		*flags++ = '\0';
		positions += check_game(line, flags);
	}
	CHECK(positions > 10000);
	(void)(file != NULL && fclose(file));
}

static bool drawn(const char *fen) {
	static const History EMPTY;
	Position pos;
	CHECK(position_from_fen(&pos, fen));
	return position_drawn(&pos, &EMPTY);
}

TEST(draws_on_the_hundredth_half_move_unless_it_mated) {
	CHECK(!drawn("4k3/8/8/8/8/8/4P3/R3K3 w - - 99 80"));
	CHECK(drawn("4k3/8/8/8/8/8/4P3/R3K3 w - - 100 80"));
	CHECK(drawn("4k3/8/8/8/8/8/4P3/4K2r w - - 100 80"));
	CHECK(!drawn("R3k3/8/4K3/8/8/8/8/8 b - - 100 80"));
}

// Every verdict here was checked against `createDrawTest` itself.
TEST(reads_insufficient_material_as_chessops_does) {
	CHECK(drawn("4k3/8/8/8/8/8/8/4K3 w - - 0 1"));
	CHECK(drawn("4k3/8/8/8/8/8/8/4KN2 w - - 0 1"));
	CHECK(!drawn("3qk3/8/8/8/8/8/8/4KN2 b - - 0 1"));
	CHECK(!drawn("4kn2/8/8/8/8/8/8/4KN2 w - - 0 1"));
	CHECK(!drawn("4k3/8/8/8/8/8/8/2NNK3 w - - 0 1"));
	CHECK(!drawn("4kb2/8/8/8/8/8/8/4KN2 w - - 0 1"));
	CHECK(drawn("4kb2/8/8/8/8/8/8/2B1K3 w - - 0 1"));
	CHECK(!drawn("4k1b1/8/8/8/8/8/8/2B1K3 w - - 0 1"));
	CHECK(!drawn("4k3/8/8/8/8/8/8/2BNK3 w - - 0 1"));
	CHECK(!drawn("4k3/p7/8/8/8/8/8/4K3 w - - 0 1"));
	CHECK(!drawn("4k3/8/8/8/8/8/8/R3K3 w - - 0 1"));
}

TEST(needs_four_plies_before_anything_can_repeat) {
	History history = {.length = 0};
	Position pos;
	CHECK(position_from_fen(&pos, "4k3/8/8/8/8/8/8/R3K3 w - - 3 1"));
	for (int ply = 0; ply < 3; ply++) {
		history_push(&history, pos.hash);
	}
	CHECK(!history_repeats(&history, &pos));
	history_push(&history, pos.hash);
	pos.halfmoves = 4;
	CHECK(history_repeats(&history, &pos));
	history_pop(&history);
	CHECK(!history_repeats(&history, &pos));
}
