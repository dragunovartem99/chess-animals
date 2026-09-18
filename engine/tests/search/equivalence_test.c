#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#include "bitboard.h"
#include "corpus.h"
#include "draw.h"
#include "evaluate.h"
#include "harness.h"
#include "position.h"
#include "reference.h"
#include "rng.h"
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

static uint64_t nodes[2];

// With every worth infinite nothing is delta pruned: the pruning depends on the window, so the
// null windows PVS tries would otherwise legitimately change the score — and so would the table,
// by reordering what the windows are set by. `seed` 0 searches the root in generated order.
static SearchResult searched(Position *pos, const float *bot, bool deepened, uint32_t seed) {
	static History history;
	static Search search;
	static Table table;
	history.length = 0;
	search_init(&search, (SearchConfig){.weights = bot,
	                                    .history = &history,
	                                    .table = deepened ? &table : NULL,
	                                    .quiescence = quiescence});
	for (Role role = PAWN; role < KING; role++) {
		search.worth[role] = __builtin_inf();
	}
	Rng rng = rng_seed(seed);
	SearchResult result = search_root(&search, pos, depth, seed != 0 ? &rng : NULL);
	nodes[deepened] += search.nodes;
	return result;
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
	SearchResult pvs = searched(&pos, bot, false, 0);
	SearchResult alpha_beta = referenced(&pos, bot, true);
	CHECK(pvs.best == alpha_beta.best && pvs.score == alpha_beta.score);
	SearchResult deepened = searched(&pos, bot, true, 0);
	CHECK(deepened.best == pvs.best && deepened.score == pvs.score);
	// Shuffled, a tie goes to the move the shuffle put first even though a pass reorders it.
	uint32_t seed = (uint32_t)line_index;
	SearchResult shuffled = searched(&pos, bot, false, seed);
	SearchResult reordered = searched(&pos, bot, true, seed);
	CHECK(reordered.best == shuffled.best && reordered.score == shuffled.score);
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
	nodes[0] = nodes[1] = 0;
	corpus_each(check_line);
	CHECK(compared > 90);
	CHECK(nodes[1] < nodes[0]);
}

// Same move and same score, not only the same score: the root keeps the first strictly best move,
// and a pruned sibling only ever reports a bound at or below it. Deepening with the table is held
// to the single pass, generated and shuffled, and has to spend fewer nodes to earn its place.
TEST(deepening_equals_pvs_equals_alpha_beta_equals_minimax) { compare(2, false); }

// Minimax stands aside here: without a stand-pat cutoff it walks every capture chain on the board.
// Alpha-beta, already held to it above, is the oracle instead.
TEST(deepening_equals_pvs_equals_alpha_beta_with_quiescence) { compare(2, true); }
