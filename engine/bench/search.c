#include <stddef.h>
#include <stdint.h>
#include <stdio.h>

#include "bench.h"
#include "corpus.h"
#include "draw.h"
#include "harness.h"
#include "position.h"
#include "search.h"

enum { MAX_BOTS = 64, SEARCH_DEPTH = 3 };

// The roster rather than a made-up bot: the evaluation is most of a node's cost, and which
// features an animal reads decides how much of it runs. Every animal at one depth, on its own
// quiescence setting, with the table and no shuffle, so the node count is a pure function of the
// search and the weights.
uint64_t bench_search(void) {
	static CorpusBot roster[MAX_BOTS];
	static History history;
	static Search search;
	static Table table;
	int bots = corpus_bots(roster, MAX_BOTS);
	CHECK(bots > 0);
	uint64_t nodes = 0;
	double start = bench_seconds();
	for (int bot = 0; bot < bots; bot++) {
		for (int index = 0; index < BENCH_POSITIONS; index++) {
			Position pos;
			CHECK(position_from_fen(&pos, BENCH_FENS[index]));
			history.length = 0;
			search_init(&search, (SearchConfig){.weights = roster[bot].weights,
			                                    .history = &history,
			                                    .table = &table,
			                                    .quiescence = roster[bot].quiescence});
			(void)search_root(&search, &pos, SEARCH_DEPTH, NULL);
			nodes += search.nodes;
		}
	}
	double seconds = bench_seconds() - start;
	(void)printf("search  %d animals x %d positions, depth %d  %llu nodes  %.2f Mnps\n", bots,
	             BENCH_POSITIONS, SEARCH_DEPTH, (unsigned long long)nodes,
	             (double)nodes / seconds * 1e-6);
	return nodes;
}
