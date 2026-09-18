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

// Sorts `moves` best-first in place: captures and promotions by MVV-LVA, then the ply's killers,
// then the rest in generated order. Stable, so equals keep chessops's order.
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

#endif
