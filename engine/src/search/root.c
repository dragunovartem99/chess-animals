#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#include "bitboard.h"
#include "draw.h"
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
void search_init(Search *search, const float *weights, History *history, bool quiescence) {
	static const int MATERIAL[KING] = {FEATURE_MATERIAL_PAWN, FEATURE_MATERIAL_KNIGHT,
	                                   FEATURE_MATERIAL_BISHOP, FEATURE_MATERIAL_ROOK,
	                                   FEATURE_MATERIAL_QUEEN};
	*search = (Search){.eval = evaluator(weights), .history = history, .quiescence = quiescence};
	for (Role role = PAWN; role < KING; role++) {
		search->worth[role] = magnitude(weights[MATERIAL[role]]) +
		                      magnitude(weights[FEATURE_CAPTURE_VALUE]) * classical_value(role);
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

// The root is not ordered on top of the shuffle: the order it searches in is the tie-break, and
// sorting captures first handed every tie to a capture — the Donkey, whose moves all tie, stopped
// being a random mover at all.
SearchResult search_root(Search *search, Position *pos, int depth, Rng *rng) {
	Move moves[MAX_MOVES];
	int count = generate_moves(pos, moves);
	Node root = {.played = NULL, .ply = 0};
	SearchResult result = {.best = MOVE_NONE, .score = -__builtin_inf()};
	if (count == 0) {
		result.score = no_moves_score(search, pos, root, move_context(pos).checkers != 0);
		return result;
	}
	if (rng != NULL) {
		shuffle(moves, count, rng);
	}
	depth = depth < MAX_PLY - 1 ? depth : MAX_PLY - 1;
	search->nodes++;
	history_push(search->history, pos->hash);
	for (int index = 0; index < count; index++) {
		Played played = played_move(pos, moves[index]);
		Undo undo;
		position_make(pos, moves[index], &undo);
		Node child = {.played = &played, .ply = 1};
		double score =
		    search_child(search, pos, child, depth - 1, result.score, __builtin_inf(), index == 0);
		position_unmake(pos, moves[index], &undo);
		// Strictly greater, so the first of the equals wins and the shuffle decides which.
		if (score > result.score) {
			result = (SearchResult){.best = moves[index], .score = score};
		}
	}
	history_pop(search->history);
	return result;
}
