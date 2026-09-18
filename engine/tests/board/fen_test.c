#include <string.h>

#include "bitboard.h"
#include "corpus.h"
#include "harness.h"
#include "position.h"

static const char *const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

static void check_round_trip(const char *fen) {
	Position pos;
	char out[FEN_MAX];
	CHECK(position_from_fen(&pos, fen));
	position_to_fen(&pos, out);
	CHECK(strcmp(out, fen) == 0);
}

static void round_trips_line(const CorpusLine *line) {
	check_round_trip(line->before);
	check_round_trip(line->after);
}

static void check_rewrites(const char *fen, const char *expected) {
	Position pos;
	char out[FEN_MAX];
	CHECK(position_from_fen(&pos, fen));
	position_to_fen(&pos, out);
	CHECK(strcmp(out, expected) == 0);
}

TEST(round_trips_every_corpus_fen) { CHECK(corpus_each(round_trips_line) > 1000); }

TEST(reads_the_start_position) {
	Position pos;
	CHECK(position_from_fen(&pos, START));
	CHECK(pos.turn == WHITE && pos.ep == SQUARE_NONE && pos.castling == 15);
	CHECK(pos.board[4] == make_piece(WHITE, KING) && pos.board[59] == make_piece(BLACK, QUEEN));
	CHECK(bb_count(pos.colors[WHITE]) == 16 && bb_count(pos.roles[PAWN]) == 16);
	CHECK(pos.hash == position_hash(&pos));
}

TEST(defaults_missing_counters_as_chessops_does) {
	check_rewrites("8/8/8/8/8/8/8/K6k b - -", "8/8/8/8/8/8/8/K6k b - - 0 1");
	check_rewrites("8/8/8/8/8/8/8/K6k w - - 7", "8/8/8/8/8/8/8/K6k w - - 7 1");
}

TEST(clamps_counters_as_make_fen_does) {
	check_rewrites("8/8/8/8/8/8/8/K6k w - - 200 0", "8/8/8/8/8/8/8/K6k w - - 150 1");
	check_rewrites("8/8/8/8/8/8/8/K6k w - - 0 12345", "8/8/8/8/8/8/8/K6k w - - 0 9999");
}

TEST(drops_rights_without_their_king_and_rook) {
	check_rewrites("r3k3/8/8/8/8/8/8/1R2K2R w KQkq - 0 1", "r3k3/8/8/8/8/8/8/1R2K2R w Kq - 0 1");
	check_rewrites("r3k2r/8/8/8/8/8/8/R4K1R w KQkq - 0 1", "r3k2r/8/8/8/8/8/8/R4K1R w kq - 0 1");
}

TEST(drops_an_en_passant_square_no_pawn_passed) {
	check_rewrites("4k3/8/8/4P3/8/8/8/4K3 w - e6 0 1", "4k3/8/8/4P3/8/8/8/4K3 w - - 0 1");
	check_rewrites("4k3/8/8/4p3/8/8/8/4K3 w - e3 0 1", "4k3/8/8/4p3/8/8/8/4K3 w - - 0 1");
	check_rewrites("4k3/4p3/8/4p3/8/8/8/4K3 w - e6 0 1", "4k3/4p3/8/4p3/8/8/8/4K3 w - - 0 1");
}

TEST(writes_en_passant_only_when_the_capture_is_legal) {
	check_rewrites("4k3/8/8/8/4P3/8/8/4K3 b - e3 0 1", "4k3/8/8/8/4P3/8/8/4K3 b - - 0 1");
	check_round_trip("4k3/8/8/8/3pP3/8/8/4K3 b - e3 0 1");
	// The capture would lift both pawns off the fourth rank and bare the king to the rook.
	check_rewrites("8/8/8/8/k2pP2R/8/8/4K3 b - e3 0 1", "8/8/8/8/k2pP2R/8/8/4K3 b - - 0 1");
}

TEST(rejects_malformed_fens) {
	static const char *const BAD[] = {
	    "",
	    "8/8/8/8/8/8/8/K6k",
	    "8/8/8/8/8/8/8/K6k x - - 0 1",
	    "8/8/8/8/8/8/8/K6kk w - - 0 1",
	    "8/8/8/8/8/8/8/K7k w - - 0 1",
	    "8/8/8/8/8/8/K6k w - - 0 1",
	    "8/8/8/8/8/8/8/8/K6k w - - 0 1",
	    "8/8/8/8/8/8/8/K5xk w - - 0 1",
	    "8/8/8/8/8/8/8/K6k w X - 0 1",
	    "8/8/8/8/8/8/8/K6k w  - 0 1",
	    "8/8/8/8/8/8/8/K6k w - z9 0 1",
	    "8/8/8/8/8/8/8/K6k w - - x 1",
	    "8/8/8/8/8/8/8/K6k w - - 0 1 extra",
	    "8/8/8/8/8/8/8/K7 w - - 0 1",
	    "P7/8/8/8/8/8/8/K6k w - - 0 1",
	};
	for (size_t index = 0; index < sizeof BAD / sizeof BAD[0]; index++) {
		Position pos;
		CHECK(!position_from_fen(&pos, BAD[index]));
	}
}
