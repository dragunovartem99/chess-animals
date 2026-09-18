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

// One slot per position, the best move found there packed beside the hash that proves it is the
// same position: the index is the hash's low 14 bits and the slot keeps the high 48, so 62 of the
// 64 are checked and an empty slot of zeros reads as MOVE_NONE. A move only, never a score
// or a bound: the table orders moves and cuts nothing, so a repetition, which makes a score depend
// on the path taken to a position, cannot leak between two lines through it.
enum { TABLE_BITS = 14, TABLE_SIZE = 1 << TABLE_BITS };

typedef struct {
	uint64_t slots[TABLE_SIZE];
} Table;

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
	// NULL for a single pass at the full depth.
	Table *table;
	uint64_t nodes;
	uint64_t node_limit;
	// Set once `nodes` reaches `node_limit`; everything searched since is thrown away.
	bool aborted;
	bool quiescence;
} Search;

typedef struct {
	const float *weights;
	History *history;
	// Iterative deepening exists to fill the table the next pass orders by, so without one there
	// is nothing to deepen for and the search goes straight to the bot's depth.
	Table *table;
	// 0 for none. Counts every node, quiescence included: that tail is what runs away when a bot's
	// weights give stand-pat and delta pruning nothing to cut on.
	uint64_t node_limit;
	bool quiescence;
} SearchConfig;

void search_init(Search *search, SearchConfig config);

typedef struct {
	// MOVE_NONE when the game is over at the root.
	Move best;
	double score;
} SearchResult;

// The move to play and what it is worth to the mover, `depth` plies down. `rng` shuffles the order
// the root tries its moves in, which is the whole of a bot's tie-break: the first move to strictly
// beat every one before it wins. NULL searches them in generated order. Past the node limit it is
// the last pass to finish — or, when not even the first did, the best of the moves it got through.
SearchResult search_root(Search *search, Position *pos, int depth, Rng *rng);

#endif
