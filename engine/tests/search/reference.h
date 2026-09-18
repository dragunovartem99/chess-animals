#ifndef ENGINE_TESTS_SEARCH_REFERENCE_H
#define ENGINE_TESTS_SEARCH_REFERENCE_H

#include <stdbool.h>

#include "draw.h"
#include "evaluate.h"
#include "position.h"
#include "search.h"

// The search's oracles, written from the rules rather than from `src/search`: the same leaf, the
// same draws and the same mate, but no ordering, no killers, no null windows and no delta pruning.
// `pruned` is plain fail-soft alpha-beta; without it every move of every node is searched.
typedef struct {
	Evaluator eval;
	History *history;
	bool quiescence;
	bool pruned;
} Reference;

// The root in generated order, the first strictly best move winning, as `search_root` does with
// no rng.
SearchResult reference_root(Reference *ref, Position *pos, int depth);

#endif
