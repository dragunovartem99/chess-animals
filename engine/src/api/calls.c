#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#include "api.h"
#include "draw.h"
#include "eval.h"
#include "move.h"
#include "movegen.h"
#include "position.h"
#include "replay.h"
#include "rng.h"
#include "search.h"

// One of each, static: the table alone is 128 KB, too much for the wasm stack, and a call never
// runs beside another — a worker holds one module and answers one request at a time.
static History history;
static Search search;
static Table table;

int32_t engine_search(uint32_t depth, uint32_t quiescence, uint32_t node_limit, uint32_t shuffle) {
	Position pos;
	Played played;
	if (!replay(&pos, &history, &played)) {
		return 0;
	}
	search_init(&search, (SearchConfig){.weights = io_weights(),
	                                    .history = &history,
	                                    .table = &table,
	                                    .node_limit = node_limit,
	                                    .quiescence = quiescence != 0});
	Rng rng = {.words = {io_rng()[0], io_rng()[1], io_rng()[2], io_rng()[3]}};
	int plies = depth < MAX_PLY ? (int)depth : MAX_PLY;
	SearchResult result = search_root(&search, &pos, plies, shuffle != 0 ? &rng : NULL);
	for (int word = 0; word < 4; word++) {
		io_rng()[word] = rng.words[word];
	}
	io_result()[0] = result.score;
	io_result()[1] = (double)search.nodes;
	io_text()[0] = '\0';
	if (result.best != MOVE_NONE) {
		move_to_uci(result.best, io_text());
	}
	return 1;
}

int32_t engine_extract(void) {
	Position pos;
	Played played;
	if (!replay(&pos, &history, &played)) {
		return 0;
	}
	extract_features(&pos, played.move != MOVE_NONE ? &played : NULL, io_features());
	return 1;
}

double engine_perft(uint32_t depth) {
	Position pos;
	Played played;
	if (!replay(&pos, &history, &played)) {
		return -1;
	}
	return (double)perft(&pos, depth < MAX_PLY ? (int)depth : MAX_PLY);
}
