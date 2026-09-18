#include <string.h>

#include "corpus.h"
#include "harness.h"
#include "move.h"
#include "movegen.h"
#include "position.h"

static void list_moves(const char *fen, char *out) {
	Position pos;
	Move moves[MAX_MOVES];
	CHECK(position_from_fen(&pos, fen));
	int count = generate_moves(&pos, moves);
	*out = '\0';
	for (int index = 0; index < count; index++) {
		if (index > 0) {
			*out++ = ' ';
		}
		move_to_uci(moves[index], out);
		out += strlen(out);
	}
}

// The whole list, order included: chessops's order is the search's tie-break, so a move list
// with the right moves in another order would still change every game.
static void generates_line(const CorpusLine *line) {
	static char moves[MAX_MOVES * UCI_MAX];
	Position pos;
	list_moves(line->before, moves);
	CHECK(strcmp(moves, line->legal) == 0);
	CHECK(position_from_fen(&pos, line->before) && perft(&pos, 2) == line->perft2);
}

TEST(generates_chessops_legal_moves_on_the_corpus) { CHECK(corpus_each(generates_line) > 1000); }

static void check_moves(const char *fen, const char *expected) {
	static char moves[MAX_MOVES * UCI_MAX];
	list_moves(fen, moves);
	CHECK(strcmp(moves, expected) == 0);
}

TEST(takes_en_passant_to_answer_the_pawn_giving_check) {
	check_moves("8/8/8/2k5/3Pp3/8/8/4K3 b - d3 0 1",
	            "e4d3 c5b4 c5c4 c5d4 c5b5 c5d5 c5b6 c5c6 c5d6");
}

TEST(refuses_en_passant_to_a_pawn_pinned_on_a_diagonal) {
	check_moves("8/8/2B5/8/3Pp3/8/8/4K2k b - d3 0 1", "h1g1 h1g2 h1h2");
}

TEST(answers_double_check_with_the_king_alone) {
	check_moves("4k3/8/8/8/8/5n2/8/r3K2R w K - 0 1", "e1e2 e1f2");
}

TEST(castles_neither_through_check_nor_into_it) {
	check_moves("4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1",
	            "a1b1 a1c1 a1d1 a1a2 a1a3 a1a4 a1a5 a1a6 a1a7 a1a8 e1a1 e1d1 e1f1 e1h1 e1d2 e1e2 "
	            "e1f2 h1f1 h1g1 h1h2 h1h3 h1h4 h1h5 h1h6 h1h7 h1h8");
	check_moves("3rkr2/8/8/8/8/8/8/R3K2R w KQ - 0 1",
	            "a1b1 a1c1 a1d1 a1a2 a1a3 a1a4 a1a5 a1a6 a1a7 a1a8 e1e2 h1f1 h1g1 h1h2 h1h3 h1h4 "
	            "h1h5 h1h6 h1h7 h1h8");
}
