#ifndef ENGINE_TESTS_EVAL_PROBE_H
#define ENGINE_TESTS_EVAL_PROBE_H

#include <math.h>
#include <stddef.h>

#include "eval.h"
#include "feature_ids.h"
#include "harness.h"
#include "move.h"
#include "position.h"

// The features of the position after `uci` is played from `fen`, or of `fen` itself at a root
// when `uci` is NULL — the same reading the wasm `extract` gives a game.
static inline float feature_after(const char *fen, const char *uci, int slot) {
	Position pos;
	CHECK(position_from_fen(&pos, fen));
	Played played = {.move = MOVE_NONE, .captured = NO_ROLE};
	if (uci != NULL) {
		Undo undo;
		CHECK(move_from_uci(uci, &played.move));
		played = played_move(&pos, played.move);
		position_make(&pos, played.move, &undo);
	}
	float features[FEATURE_COUNT];
	extract_features(&pos, uci == NULL ? NULL : &played, features);
	return features[slot];
}

static inline float feature_at(const char *fen, int slot) { return feature_after(fen, NULL, slot); }

// For the features that fade in by a fraction, which no exact float compares against.
static inline bool near(float value, float expected) { return fabsf(value - expected) < 1e-5F; }

#endif
