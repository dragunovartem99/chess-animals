#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#include "api.h"
#include "bench.h"
#include "harness.h"

const char *const BENCH_FENS[BENCH_POSITIONS] = {
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
    "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1",
    "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1",
    "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8",
    "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10",
    "r3k2r/2pb1ppp/2pp1q2/p7/1nP1B3/1P2P3/P2N1PPP/R2QK2R w KQkq a6 0 14",
    "4rrk1/2p1b1p1/p1p3q1/4p3/2P2n1p/1P1NR2P/PB3PP1/3R1QK1 b - - 2 24",
    "6k1/6p1/6Pp/ppp5/3pn2P/1P3K2/1PP2P2/3N4 b - - 0 1",
    "8/8/8/8/5kp1/P7/8/1K1N4 w - - 0 80",
};

// `timespec_get` rather than `clock_gettime`: it is C11, so no POSIX feature macro is needed.
double bench_seconds(void) {
	struct timespec now;
	(void)timespec_get(&now, TIME_UTC);
	return (double)now.tv_sec + (double)now.tv_nsec * 1e-9;
}

// The fixture readers report through the test harness; here a failure ends the run, since a bench
// over a partly read roster would print a signature that means nothing.
void harness_fail(Failure failure) {
	(void)fprintf(stderr, "%s:%d: CHECK(%s) failed\n", failure.file, failure.line, failure.expr);
	exit(1);
}

// The signature is the one line a commit quotes: a speed-only change leaves it alone, and one
// that moves it has changed what the search does.
int main(void) {
	engine_init();
	bench_perft();
	bench_eval();
	uint64_t signature = bench_search();
	(void)printf("signature %llu\n", (unsigned long long)signature);
	return 0;
}
