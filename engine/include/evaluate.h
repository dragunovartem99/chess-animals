#ifndef ENGINE_EVALUATE_H
#define ENGINE_EVALUATE_H

#include <stdbool.h>

#include "eval.h"
#include "feature_ids.h"
#include "position.h"

// The unit a game-ending position is scored in. It only has to sit clear of what an ordinary
// evaluation reaches — a full board of classical values is under ten thousand.
enum { MATE_SCORE = 100000 };

// `liveSlots`: the slots a bot actually weighs, ascending, into `slots` (FEATURE_COUNT ints).
// Returns the count. A zero weight cannot change a score, so the dot walks only these.
int live_slots(const float *weights, int *slots);

// `terminalScore`: a mate **replaces** the evaluation rather than joining it, decaying with `ply`
// so the shortest mate wins, and signed by the `givesMate` preference. False — score untouched —
// when the position is not mate, or the bot has no opinion on mate and must evaluate it normally.
// Stalemate is not scored here.
bool terminal_score(const Position *pos, const float *weights, int ply, double *score);

// `createEvaluator`: one bot's weights, the slots it reads and their extractors, worked out once
// per search — so a node runs exactly the features the bot weighs, with no weight tested per node.
typedef struct {
	const float *weights;
	int slots[FEATURE_COUNT];
	Extractor extractors[FEATURE_COUNT];
	int count;
} Evaluator;

Evaluator evaluator(const float *weights);

// `dot`, for a caller that has already ruled the position out as mate: each live feature times its
// weight, summed in slot order in double — the TS order and precision, so the same float32
// features give the same bits.
double evaluate_features(const Evaluator *eval, const Position *pos, const Played *played);

// What the position is worth to the side to move: the terminal score if there is one, the dot
// otherwise. `played` is NULL at a root, as for `extract_features`.
double evaluate(const Evaluator *eval, const Position *pos, const Played *played, int ply);

#endif
