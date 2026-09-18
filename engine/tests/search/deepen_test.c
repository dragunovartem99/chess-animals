#include <stdbool.h>
#include <stdint.h>
#include <string.h>

#include "draw.h"
#include "feature_ids.h"
#include "harness.h"
#include "move.h"
#include "movegen.h"
#include "position.h"
#include "search.h"

static History history;
static Search search;
static Table table;

static const float *material(void) {
	static float weights[FEATURE_COUNT];
	weights[FEATURE_MATERIAL_PAWN] = 100;
	weights[FEATURE_MATERIAL_KNIGHT] = 300;
	weights[FEATURE_MATERIAL_BISHOP] = 300;
	weights[FEATURE_MATERIAL_ROOK] = 500;
	weights[FEATURE_MATERIAL_QUEEN] = 900;
	return weights;
}

static SearchResult run(const char *fen, SearchConfig config, int depth) {
	Position pos;
	CHECK(position_from_fen(&pos, fen));
	history.length = 0;
	config.history = &history;
	config.table = &table;
	search_init(&search, config);
	return search_root(&search, &pos, depth, NULL);
}

static bool plays(SearchResult result, const char *uci) {
	char written[UCI_MAX];
	move_to_uci(result.best, written);
	return result.best != MOVE_NONE && strcmp(written, uci) == 0;
}

// The Dodo's weights under quiescence: blind to material, it stands pat on nothing and delta
// prunes nothing, and unlimited this one move runs to millions of nodes.
TEST(a_material_blind_bot_stays_within_its_budget) {
	static float dodo[FEATURE_COUNT];
	dodo[FEATURE_KING_PROXIMITY] = 10;
	const char *fen = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
	SearchConfig config = {.weights = dodo, .node_limit = 20000, .quiescence = true};
	SearchResult result = run(fen, config, 2);
	CHECK(search.aborted && search.nodes == 20000);
	CHECK(result.best != MOVE_NONE);
}

// Qxd5 wins a pawn one ply down and loses the queen to exd5 two plies down. A limit that cuts
// the second pass off plays what the first one found, not a half-searched second opinion.
TEST(plays_the_last_finished_pass) {
	const char *fen = "4k3/8/4p3/3p4/8/8/8/3QK3 w - - 0 1";
	CHECK(plays(run(fen, (SearchConfig){.weights = material()}, 1), "d1d5"));
	uint64_t first_pass = search.nodes;
	CHECK(!plays(run(fen, (SearchConfig){.weights = material()}, 2), "d1d5"));
	SearchConfig config = {.weights = material(), .node_limit = first_pass + 1};
	SearchResult result = run(fen, config, 2);
	CHECK(search.aborted && plays(result, "d1d5") && result.score == 800);
}

// A limit spent before the first root move has a verdict still plays a move, the first it tried.
TEST(plays_the_first_move_when_no_move_finished) {
	const char *fen = "4k3/8/4p3/3p4/8/8/8/3QK3 w - - 0 1";
	Position pos;
	Move moves[MAX_MOVES];
	CHECK(position_from_fen(&pos, fen));
	CHECK(generate_moves(&pos, moves) > 0);
	SearchResult result = run(fen, (SearchConfig){.weights = material(), .node_limit = 1}, 2);
	CHECK(search.aborted && search.nodes == 1 && result.best == moves[0]);
}
