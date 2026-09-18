#ifndef ENGINE_SEARCH_NODE_H
#define ENGINE_SEARCH_NODE_H

#include <stdbool.h>
#include <stdint.h>

#include "eval.h"
#include "move.h"
#include "position.h"
#include "search.h"

// What the recursion hands down: the move that led here, read off the parent before it was made,
// and how far the node stands from the root.
typedef struct {
	const Played *played;
	int ply;
} Node;

// The root's moves in the order the shuffle left them, and the one a pass tries first.
typedef struct {
	const Move *moves;
	int count;
	int lead;
} Root;

// One pass over the root to `depth`. Aborted partway, it holds the best of the moves it finished.
SearchResult search_pass(Search *search, Position *pos, Root root, int depth);

// Fail-soft PVS to `depth`, then quiescence or the evaluation.
double search_node(Search *search, Position *pos, Node node, int depth, double alpha, double beta);

// One child, from the parent's side. Every move after the first is expected to fail low, so it is
// tried on a null window first and searched in full only when it beats `alpha` after all.
double search_child(Search *search, Position *pos, Node child, int depth, double alpha, double beta,
                    bool first);

double quiesce(Search *search, Position *pos, Node node, double alpha, double beta);

// A position with no legal move: mate, scored as the evaluation scores it, or stalemate, a draw.
double no_moves_score(const Search *search, const Position *pos, Node node, bool in_check);

// Whether the move takes a man — the rook a castling king "takes" is its own, so it does not.
bool is_capture(const Position *pos, Move move);

// What a move sorts by among its stage's moves, the higher first. Noisy: MVV-LVA, promotions by
// what the pawn becomes. Quiet: the ply's killers, then `cutoffs`.
int noisy_priority(const Position *pos, Move move);
int quiet_priority(const Search *search, const Position *pos, Move move, int ply);

// A quiet move refuted the node: it becomes the ply's first killer and gains on `cutoffs`.
void record_cutoff(Search *search, const Position *pos, Move move, int ply, int depth);

void table_clear(Table *table);
// MOVE_NONE when the position is not in the table.
Move table_move(const Table *table, uint64_t hash);
// Always replaces: the newest entry is the one from the deepest pass so far.
void table_store(Table *table, uint64_t hash, Move move);

// Checked on entering a node, before it is counted, so a search never counts past its limit.
static inline bool exhausted(Search *search) {
	search->aborted = search->aborted || search->nodes >= search->node_limit;
	return search->aborted;
}

// Quiescence's order, the main search's picker aside: captures and promotions by MVV-LVA, then the
// ply's killers, then the rest in generated order. Stable, so equals keep chessops's order.
void order_moves(const Search *search, const Position *pos, Move *moves, int count, int ply);

// The next double above `value`. Scores are doubles, so there is no `alpha + 1`: a null window is
// (alpha, next_up(alpha)), which no score falls strictly inside.
static inline double next_up(double value) {
	if (value == 0) {
		return __DBL_DENORM_MIN__;
	}
	// A union rather than memcpy: C defines the pun, and the wasm build has no libc to call.
	union {
		double value;
		uint64_t bits;
	} pun = {.value = value};
	pun.bits = value > 0 ? pun.bits + 1 : pun.bits - 1;
	return pun.value;
}

// The next double below `value`, for a window a score equal to `value` falls strictly above.
static inline double next_down(double value) { return -next_up(-value); }

#endif
