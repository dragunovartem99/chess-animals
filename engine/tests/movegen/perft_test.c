#include <stdint.h>

#include "harness.h"
#include "movegen.h"
#include "position.h"

// chessprogramming.org's perft suite, each as deep as the sanitized binary runs in well under a
// second. Depth 5 throughout is ten times that here, so it belongs to the optimized bench.
typedef struct {
	const char *fen;
	int depth;
	uint64_t nodes;
} PerftCase;

static void check_perft(PerftCase test) {
	Position pos;
	CHECK(position_from_fen(&pos, test.fen));
	CHECK(perft(&pos, test.depth) == test.nodes);
}

TEST(counts_the_start_position) {
	check_perft(
	    (PerftCase){"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", 5, 4865609});
}

TEST(counts_kiwipete) {
	check_perft((PerftCase){"r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
	                        4, 4085603});
}

TEST(counts_position_3) {
	check_perft((PerftCase){"8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1", 5, 674624});
}

TEST(counts_position_4) {
	check_perft(
	    (PerftCase){"r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1", 4, 422333});
}

TEST(counts_position_5) {
	check_perft(
	    (PerftCase){"rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8", 4, 2103487});
}

TEST(counts_position_6) {
	check_perft((PerftCase){
	    "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10", 4, 3894594});
}
