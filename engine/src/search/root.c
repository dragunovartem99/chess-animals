#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#include "bitboard.h"
#include "eval.h"
#include "evaluate.h"
#include "feature_ids.h"
#include "move.h"
#include "movegen.h"
#include "node.h"
#include "position.h"
#include "rng.h"
#include "search.h"
#include "values.h"

static double magnitude(float weight) { return weight < 0 ? -(double)weight : (double)weight; }

// Absolute values, because the bound has to be optimistic both ways: a bot paid to shed material
// gains by being taken, and pruning on a signed value would cut the lines it plays for.
// `captureValue` counts beside the material, since it is the other term a capture moves alone.
void search_init(Search *search, SearchConfig config) {
	static const int MATERIAL[KING] = {FEATURE_MATERIAL_PAWN, FEATURE_MATERIAL_KNIGHT,
	                                   FEATURE_MATERIAL_BISHOP, FEATURE_MATERIAL_ROOK,
	                                   FEATURE_MATERIAL_QUEEN};
	*search = (Search){
	    .eval = evaluator(config.weights),
	    .history = config.history,
	    .table = config.table,
	    .node_limit = config.node_limit == 0 ? UINT64_MAX : config.node_limit,
	    .quiescence = config.quiescence,
	};
	for (Role role = PAWN; role < KING; role++) {
		search->worth[role] =
		    magnitude(config.weights[MATERIAL[role]]) +
		    magnitude(config.weights[FEATURE_CAPTURE_VALUE]) * classical_value(role);
	}
	search->worth[KING] = __builtin_inf();
}

// Fisher-Yates, as `shuffled` draws it, so the same seed shuffles the same way on both sides.
static void shuffle(Move *moves, int count, Rng *rng) {
	for (int index = count - 1; index > 0; index--) {
		uint32_t swap = rng_int(rng, (uint32_t)index + 1);
		Move held = moves[index];
		moves[index] = moves[swap];
		moves[swap] = held;
	}
}

static int index_of(const Move *moves, int count, Move move) {
	int index = 0;
	while (index < count - 1 && moves[index] != move) {
		index++;
	}
	return index;
}

// Not even the first move got a verdict inside the limit, so it is played on its evaluation alone.
static SearchResult unsearched(const Search *search, Position *pos, Move move) {
	Played played = played_move(pos, move);
	Undo undo;
	position_make(pos, move, &undo);
	double score = -evaluate(&search->eval, pos, &played, 1);
	position_unmake(pos, move, &undo);
	return (SearchResult){.best = move, .score = score};
}

// The root is not ordered on top of the shuffle: the order it searches in is the tie-break, and
// sorting captures first handed every tie to a capture — the Donkey, whose moves all tie, stopped
// being a random mover at all. The one move a pass puts first is the last pass's best, and
// `search_pass` keeps the shuffle's tie-break regardless.
SearchResult search_root(Search *search, Position *pos, int depth, Rng *rng) {
	Move moves[MAX_MOVES];
	int count = generate_moves(pos, moves);
	SearchResult result = {.best = MOVE_NONE, .score = -__builtin_inf()};
	if (count == 0) {
		Node root = {.played = NULL, .ply = 0};
		result.score = no_moves_score(search, pos, root, move_context(pos).checkers != 0);
		return result;
	}
	if (rng != NULL) {
		shuffle(moves, count, rng);
	}
	if (search->table != NULL) {
		table_clear(search->table);
	}
	depth = depth < MAX_PLY - 1 ? depth : MAX_PLY - 1;
	Root root = {.moves = moves, .count = count, .lead = 0};
	for (int pass = search->table != NULL ? 1 : depth; pass <= depth; pass++) {
		SearchResult found = search_pass(search, pos, root, pass);
		// A pass cut off halfway has compared only some of the moves, on a deeper look than the
		// pass before it took at all of them; the complete one is the better-founded choice.
		if (search->aborted) {
			result = result.best == MOVE_NONE ? found : result;
			break;
		}
		result = found;
		root.lead = index_of(moves, count, found.best);
	}
	return result.best != MOVE_NONE ? result : unsearched(search, pos, moves[0]);
}
