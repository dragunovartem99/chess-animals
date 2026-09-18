#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#include "bitboard.h"
#include "draw.h"
#include "feature_ids.h"
#include "harness.h"
#include "move.h"
#include "movegen.h"
#include "position.h"
#include "rng.h"
#include "search.h"

static History history;
static Search search;

static const float *material(void) {
	static float weights[FEATURE_COUNT];
	weights[FEATURE_MATERIAL_PAWN] = 100;
	weights[FEATURE_MATERIAL_KNIGHT] = 300;
	weights[FEATURE_MATERIAL_BISHOP] = 300;
	weights[FEATURE_MATERIAL_ROOK] = 500;
	weights[FEATURE_MATERIAL_QUEEN] = 900;
	weights[FEATURE_GIVES_MATE] = 1;
	return weights;
}

static SearchResult run(const char *fen, int depth, bool quiescence) {
	Position pos;
	CHECK(position_from_fen(&pos, fen));
	history.length = 0;
	search_init(&search, material(), &history, quiescence);
	return search_root(&search, &pos, depth, NULL);
}

// Qxd5 wins a pawn if the search stops there, and loses the queen to exd5 if it does not.
TEST(sees_the_recapture_past_the_last_ply) {
	const char *fen = "4k3/8/4p3/3p4/8/8/8/3QK3 w - - 0 1";
	CHECK(run(fen, 1, false).score == 800);
	CHECK(run(fen, 1, true).score == 700);
}

// White can only push the c-pawn, and loses it either way: to dxc3 after c3, and to d4xc3 en
// passant after c4 — which a search blind to en passant would read as safe. The d3 pawn is there
// so the capture frees a move: without it White's boxed king is stalemated, and takes the draw.
TEST(takes_en_passant_in_quiescence) {
	const char *fen = "k7/8/8/8/3p4/3P2p1/2P1n1P1/7K w - - 0 1";
	Position pos;
	Move moves[MAX_MOVES];
	CHECK(position_from_fen(&pos, fen));
	CHECK(generate_moves(&pos, moves) == 2);
	CHECK(run(fen, 1, false).score == -200);
	CHECK(run(fen, 1, true).score == -300);
}

// Nothing White does stops a1=Q, and it is a quiet move: a search that only tried captures would
// stop at the pawn.
TEST(promotes_in_quiescence) {
	const char *fen = "7k/8/8/8/8/8/p7/4K3 w - - 0 1";
	CHECK(run(fen, 1, false).score == -100);
	CHECK(run(fen, 1, true).score <= -800);
}

// Absolute values: a bot paid to shed its queen gains by having it taken, and must not have that
// line pruned on a negative price.
TEST(prices_captures_by_the_bot_own_weights) {
	float weights[FEATURE_COUNT] = {0};
	weights[FEATURE_MATERIAL_PAWN] = 100;
	weights[FEATURE_MATERIAL_QUEEN] = -900;
	weights[FEATURE_CAPTURE_VALUE] = 5;
	search_init(&search, weights, &history, true);
	CHECK(search.worth[PAWN] == 105 && search.worth[KNIGHT] == 15);
	CHECK(search.worth[QUEEN] == 945 && search.worth[KING] == __builtin_inf());
}

// Delta pruning cuts captures a lost position cannot be saved by; with every worth infinite it
// cuts nothing, and the score only ever moves by the margin it was allowed.
TEST(delta_pruning_saves_nodes) {
	const char *fen = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
	SearchResult pruned = run(fen, 2, true);
	uint64_t pruned_nodes = search.nodes;
	Position pos;
	CHECK(position_from_fen(&pos, fen));
	history.length = 0;
	search_init(&search, material(), &history, true);
	for (Role role = PAWN; role < KING; role++) {
		search.worth[role] = __builtin_inf();
	}
	SearchResult full = search_root(&search, &pos, 2, NULL);
	CHECK(pruned_nodes < search.nodes);
	CHECK(pruned.best == full.best && pruned.score == full.score);
}

// The root's tie-break, against `chooseMove` with every weight at zero — every move ties, so the
// move is the first of the shuffle — and the stream is left where the TS one is.
TEST(shuffles_the_root_as_the_ts_search_does) {
	static const char *const CASES[][3] = {
	    {"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "c2c4", "847933"},
	    {"r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1", "e5c6", "439744"},
	};
	static const uint32_t SEEDS[] = {42, 7};
	static const float ZERO[FEATURE_COUNT];
	for (int index = 0; index < 2; index++) {
		Position pos;
		CHECK(position_from_fen(&pos, CASES[index][0]));
		Rng rng = rng_seed(SEEDS[index]);
		history.length = 0;
		search_init(&search, ZERO, &history, false);
		char uci[UCI_MAX];
		move_to_uci(search_root(&search, &pos, 1, &rng).best, uci);
		CHECK(strcmp(uci, CASES[index][1]) == 0);
		CHECK(rng_int(&rng, 1000000) == (uint32_t)strtol(CASES[index][2], NULL, 10));
	}
}
