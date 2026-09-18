#include <stddef.h>
#include <stdio.h>

#include "bench.h"
#include "eval.h"
#include "feature_ids.h"
#include "harness.h"
#include "move.h"
#include "movegen.h"
#include "position.h"

enum { MAX_SAMPLES = BENCH_POSITIONS * MAX_MOVES, REPEATS = 200 };

// Every position a bench position leads to in one move, with the move that led there: what a
// search evaluates, where the positions themselves would be ten samples.
static Position positions[MAX_SAMPLES];
static Played played[MAX_SAMPLES];
static EvalContext walked[MAX_SAMPLES];
static int samples;
// Read after every timing, so no loop's work can be optimised away as unused.
static volatile float sink;

static void collect(void) {
	samples = 0;
	for (int index = 0; index < BENCH_POSITIONS; index++) {
		Position parent;
		Move moves[MAX_MOVES];
		CHECK(position_from_fen(&parent, BENCH_FENS[index]));
		int count = generate_moves(&parent, moves);
		for (int move = 0; move < count; move++) {
			Undo undo;
			played[samples] = played_move(&parent, moves[move]);
			positions[samples] = parent;
			position_make(&positions[samples], moves[move], &undo);
			samples++;
		}
	}
	for (int index = 0; index < samples; index++) {
		walked[index] = eval_context(&positions[index], &played[index]);
		eval_walk(&walked[index]);
	}
}

static void report(const char *name, double start) {
	double calls = (double)(samples * REPEATS);
	(void)printf("eval    %-17s %7.1f ns\n", name, (bench_seconds() - start) / calls * 1e9);
}

// The shared context and its attack walk are timed on their own, so each feature reads as what it
// adds on top of them: a bot pays for the walk once, whichever of its features asks first.
void bench_eval(void) {
	collect();
	float features[FEATURE_COUNT] = {0};
	double start = bench_seconds();
	for (int repeat = 0; repeat < REPEATS; repeat++) {
		for (int index = 0; index < samples; index++) {
			EvalContext ctx = eval_context(&positions[index], &played[index]);
			eval_walk(&ctx);
			features[0] += (float)ctx.attacks_by[0];
		}
	}
	report("context", start);
	for (int slot = 0; slot < FEATURE_COUNT; slot++) {
		start = bench_seconds();
		for (int repeat = 0; repeat < REPEATS; repeat++) {
			for (int index = 0; index < samples; index++) {
				features[slot] += EXTRACTORS[slot](&walked[index]);
			}
		}
		report(FEATURE_KEYS[slot], start);
	}
	start = bench_seconds();
	for (int repeat = 0; repeat < REPEATS; repeat++) {
		for (int index = 0; index < samples; index++) {
			extract_features(&positions[index], &played[index], features);
		}
	}
	report("all", start);
	for (int slot = 0; slot < FEATURE_COUNT; slot++) {
		sink += features[slot];
	}
}
