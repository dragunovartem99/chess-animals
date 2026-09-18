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
	for (int index = 0; index < eval.count; index++) {
		eval.extractors[index] = EXTRACTORS[eval.slots[index]];
	}
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
	EvalContext ctx = eval_context(pos, played);
	double total = 0;
	for (int index = 0; index < eval->count; index++) {
		float feature = eval->extractors[index](&ctx);
		total += (double)feature * (double)eval->weights[eval->slots[index]];
	}
	return total;
}
