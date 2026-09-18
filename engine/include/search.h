#ifndef ENGINE_SEARCH_H
#define ENGINE_SEARCH_H

#include <stdbool.h>
#include <stdint.h>

#include "bitboard.h"
#include "draw.h"
#include "evaluate.h"
#include "move.h"
#include "position.h"
#include "rng.h"

// Deeper than any line reaches: the bot's depth plus a quiescence tail, which stops here and
// stands pat rather than overrun the killers or the stack.
enum { MAX_PLY = 64 };

// Everything one search holds for the whole of its life. Nothing outlives it: a table carried
// from one search to the next would make a move depend on which games the worker played before,
// and the arena's result cache rests on a game being a pure function of its spec.
typedef struct {
	Evaluator eval;
	// The game so far, then the search's own ancestors; see `History`.
	History *history;
	// The most taking a man of each role can win this bot, from its own weights — what delta
	// pruning prices a capture at. A king is infinite: it is never taken, so never pruned for.
	double worth[ROLE_COUNT];
	// The last two quiet moves that refuted a sibling at each ply.
	Move killers[MAX_PLY][2];
	uint64_t nodes;
	bool quiescence;
} Search;

void search_init(Search *search, const float *weights, History *history, bool quiescence);

typedef struct {
	// MOVE_NONE when the game is over at the root.
	Move best;
	double score;
} SearchResult;

// The move to play and what it is worth to the mover, `depth` plies down. `rng` shuffles the order
// the root tries its moves in, which is the whole of a bot's tie-break: the first move to strictly
// beat every one before it wins. NULL searches them in generated order.
SearchResult search_root(Search *search, Position *pos, int depth, Rng *rng);

#endif
