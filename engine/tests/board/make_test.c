#include <stdbool.h>
#include <string.h>

#include "corpus.h"
#include "harness.h"
#include "move.h"
#include "position.h"

// Field by field rather than one memcmp: the struct has padding, whose bytes nothing promises.
static bool same_position(const Position *a, const Position *b) {
	return memcmp(a->colors, b->colors, sizeof a->colors) == 0 &&
	       memcmp(a->roles, b->roles, sizeof a->roles) == 0 &&
	       memcmp(a->board, b->board, sizeof a->board) == 0 && a->hash == b->hash &&
	       a->halfmoves == b->halfmoves && a->fullmoves == b->fullmoves && a->turn == b->turn &&
	       a->ep == b->ep && a->castling == b->castling;
}

// Plays the move as chessops did and checks everything make and unmake promise: the same position
// out, the incremental hash equal to one computed from scratch, and unmake giving back the exact
// position it started from.
static void check_make(const char *before, const char *uci, const char *after) {
	Position pos;
	Position saved;
	Move move = MOVE_NONE;
	Undo undo;
	char out[FEN_MAX];
	CHECK(position_from_fen(&pos, before) && move_from_uci(uci, &move));
	saved = pos;

	position_make(&pos, move, &undo);
	position_to_fen(&pos, out);
	CHECK(strcmp(out, after) == 0);
	CHECK(pos.hash == position_hash(&pos));

	position_unmake(&pos, move, &undo);
	CHECK(same_position(&pos, &saved));
}

static void makes_line(const CorpusLine *line) { check_make(line->before, line->uci, line->after); }

TEST(plays_every_corpus_move_as_chessops_does) { CHECK(corpus_each(makes_line) > 1000); }

TEST(castles_from_the_kings_two_square_step) {
	check_make("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "e1g1",
	           "r3k2r/8/8/8/8/8/8/R4RK1 b kq - 1 1");
	check_make("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "e1c1",
	           "r3k2r/8/8/8/8/8/8/2KR3R b kq - 1 1");
	check_make("r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1", "e8g8",
	           "r4rk1/8/8/8/8/8/8/R3K2R w KQ - 1 2");
	check_make("r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1", "e8c8",
	           "2kr3r/8/8/8/8/8/8/R3K2R w KQ - 1 2");
}

TEST(takes_en_passant_for_both_colours) {
	check_make("4k3/8/8/3Pp3/8/8/8/4K3 w - e6 0 1", "d5e6", "4k3/8/4P3/8/8/8/8/4K3 b - - 0 1");
	check_make("4k3/8/8/8/3pP3/8/8/4K3 b - e3 0 1", "d4e3", "4k3/8/8/8/8/4p3/8/4K3 w - - 0 2");
}
