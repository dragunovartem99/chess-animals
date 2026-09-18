#include <stdbool.h>

#include "eval.h"
#include "evaluate.h"
#include "feature_ids.h"
#include "move.h"
#include "movegen.h"
#include "position.h"

int live_slots(const float *weights, int *slots) {
	int count = 0;
	for (int slot = 0; slot < FEATURE_COUNT; slot++) {
		if (weights[slot] != 0) {
			slots[count++] = slot;
		}
	}
	return count;
}

double eval_dot(const float *features, const float *weights, const int *slots, int count) {
	double total = 0;
	for (int index = 0; index < count; index++) {
		total += (double)features[slots[index]] * (double)weights[slots[index]];
	}
	return total;
}

bool terminal_score(const Position *pos, const float *weights, int ply, double *score) {
	// The weight first: proving mate means generating moves, and a bot that cannot see mate should
	// not pay for that at every node.
	float preference = weights[FEATURE_GIVES_MATE];
	if (preference == 0 || move_context(pos).checkers == 0) {
		return false;
	}
	Move moves[MAX_MOVES];
	if (generate_moves(pos, moves) > 0) {
		return false;
	}
	*score = -(double)(MATE_SCORE - ply) * (double)preference;
	return true;
}

Evaluator evaluator(const float *weights) {
	Evaluator eval = {.weights = weights};
	eval.count = live_slots(weights, eval.slots);
	return eval;
}

double evaluate(const Evaluator *eval, const Position *pos, const Played *played, int ply) {
	double score = 0;
	if (terminal_score(pos, eval->weights, ply, &score)) {
		return score;
	}
	return evaluate_features(eval, pos, played);
}

double evaluate_features(const Evaluator *eval, const Position *pos, const Played *played) {
	float features[FEATURE_COUNT];
	extract_features(pos, played, features);
	return eval_dot(features, eval->weights, eval->slots, eval->count);
}
