#include <math.h>
#include <stddef.h>

#include "bitboard.h"
#include "eval.h"
#include "feature_ids.h"
#include "harness.h"
#include "position.h"

static const char *const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

TEST(walks_the_board_only_when_asked) {
	Position pos;
	CHECK(position_from_fen(&pos, START));
	EvalContext ctx = eval_context(&pos);
	CHECK(!ctx.walked && ctx.us == WHITE && ctx.them == BLACK);
	eval_walk(&ctx);
	CHECK(ctx.walked);
	// Every square of the second and third ranks, and the first but its corners, which nothing
	// covers: the rooks' reach stops at the knights beside them.
	CHECK(ctx.attacks_by[WHITE] == 0xffff7eU);
	CHECK(ctx.attacks_by[BLACK] == 0x7effff0000000000U);
	CHECK(ctx.pawn_attacks[WHITE] == 0xff0000U && ctx.pawn_attacks[BLACK] == 0xff0000000000U);
	CHECK(ctx.reach[1] == (square_bb(16) | square_bb(18) | square_bb(11)));
	eval_walk(&ctx);
	CHECK(ctx.attacks_by[WHITE] == 0xffff7eU);
}

TEST(reads_the_phase_from_the_pieces_left) {
	Position pos;
	CHECK(position_from_fen(&pos, START) && eval_phase(&pos) == 1.0);
	CHECK(position_from_fen(&pos, "4k3/pppp4/8/8/8/8/PPPP4/4K3 w - - 0 1") &&
	      eval_phase(&pos) == 0);
	CHECK(position_from_fen(&pos, "4k3/8/8/8/8/8/8/R3K3 w - - 0 1") &&
	      eval_phase(&pos) == 2 / 24.0);
	CHECK(position_from_fen(&pos, "QQQQk3/8/8/8/8/8/8/QQQQK3 w - - 0 1") &&
	      eval_phase(&pos) == 1.0);
}

// A perfect mirror is `-asymmetry` of zero in TS, which a Float32Array keeps as -0. The fixture
// has no such position — every line comes a move after one — so this pins the sign bit here.
TEST(reads_a_perfect_mirror_as_negative_zero) {
	Position pos;
	float features[FEATURE_COUNT];
	CHECK(position_from_fen(&pos, "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"));
	extract_features(&pos, NULL, features);
	CHECK(features[FEATURE_MIRROR_RANKS] == 0 && signbit(features[FEATURE_MIRROR_RANKS]));
}
