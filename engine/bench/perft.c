#include <stdint.h>
#include <stdio.h>

#include "bench.h"
#include "harness.h"
#include "movegen.h"
#include "position.h"

enum { PERFT_DEPTH = 5 };

// chessprogramming.org's counts at depth 5, checked as well as timed: a fast wrong movegen is no
// result at all.
static const uint64_t EXPECTED[PERFT_POSITIONS] = {
    4865609, 193690690, 674624, 15833292, 89941194, 164075551,
};

void bench_perft(void) {
	uint64_t total = 0;
	double elapsed = 0;
	for (int index = 0; index < PERFT_POSITIONS; index++) {
		Position pos;
		CHECK(position_from_fen(&pos, BENCH_FENS[index]));
		double start = bench_seconds();
		uint64_t leaves = perft(&pos, PERFT_DEPTH);
		double seconds = bench_seconds() - start;
		CHECK(leaves == EXPECTED[index]);
		(void)printf("perft   position %d  %10llu leaves  %6.1f Mnps\n", index + 1,
		             (unsigned long long)leaves, (double)leaves / seconds * 1e-6);
		total += leaves;
		elapsed += seconds;
	}
	(void)printf("perft   total       %10llu leaves  %6.1f Mnps\n", (unsigned long long)total,
	             (double)total / elapsed * 1e-6);
}
