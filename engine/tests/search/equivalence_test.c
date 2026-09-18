#include <stdbool.h>
#include <stddef.h>

#include "bitboard.h"
#include "corpus.h"
#include "draw.h"
#include "evaluate.h"
#include "harness.h"
#include "position.h"
#include "reference.h"
#include "search.h"

enum { MAX_BOTS = 64 };

// Every nth corpus line: minimax is the whole tree, and the test binary runs under sanitizers.
enum { STRIDE = 16 };

static CorpusBot roster[MAX_BOTS];
// The animals this pass searches as, cycled through one per position.
static const CorpusBot *animals[MAX_BOTS];
static int animal_count;
static int line_index;
static int compared;
static int depth;
static bool quiescence;

// With every worth infinite nothing is delta pruned: the pruning depends on the window, so the
// null windows PVS tries would otherwise legitimately change the score.
static SearchResult searched(Position *pos, const float *bot) {
	static History history;
	static Search search;
	history.length = 0;
	search_init(&search, bot, &history, quiescence);
	for (Role role = PAWN; role < KING; role++) {
		search.worth[role] = __builtin_inf();
	}
	return search_root(&search, pos, depth, NULL);
}

static SearchResult referenced(Position *pos, const float *bot, bool pruned) {
	static History history;
	history.length = 0;
	Reference ref = {
	    .eval = evaluator(bot), .history = &history, .quiescence = quiescence, .pruned = pruned};
	return reference_root(&ref, pos, depth);
}

static void check_line(const CorpusLine *line) {
	if (line_index++ % STRIDE != 0) {
		return;
	}
	Position pos;
	CHECK(position_from_fen(&pos, line->before));
	const float *bot = animals[compared % animal_count]->weights;
	SearchResult pvs = searched(&pos, bot);
	SearchResult alpha_beta = referenced(&pos, bot, true);
	CHECK(pvs.best == alpha_beta.best && pvs.score == alpha_beta.score);
	if (!quiescence) {
		SearchResult minimax = referenced(&pos, bot, false);
		CHECK(alpha_beta.best == minimax.best && alpha_beta.score == minimax.score);
	}
	compared++;
}

// Each animal as it plays. Quiescence on the Dodo or the Parrot, whose weights make every capture
// look like standing pat, prunes nothing and costs millions of nodes a move — and no roster
// animal searches that way.
static void compare(int at_depth, bool with_quiescence) {
	int bots = corpus_bots(roster, MAX_BOTS);
	animal_count = 0;
	for (int bot = 0; bot < bots; bot++) {
		if (!with_quiescence || roster[bot].quiescence) {
			animals[animal_count++] = &roster[bot];
		}
	}
	CHECK(animal_count > 0);
	depth = at_depth;
	quiescence = with_quiescence;
	line_index = 0;
	compared = 0;
	corpus_each(check_line);
	CHECK(compared > 90);
}

// Same move and same score, not only the same score: the root keeps the first strictly best move,
// and a pruned sibling only ever reports a bound at or below it.
TEST(pvs_equals_alpha_beta_equals_minimax) { compare(2, false); }

// Minimax stands aside here: without a stand-pat cutoff it walks every capture chain on the board.
// Alpha-beta, already held to it above, is the oracle instead.
TEST(pvs_equals_alpha_beta_with_quiescence) { compare(2, true); }
