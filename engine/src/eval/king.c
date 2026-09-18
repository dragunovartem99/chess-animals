#include "attacks.h"
#include "bitboard.h"
#include "eval.h"
#include "families.h"
#include "feature_ids.h"
#include "position.h"

// What a man is worth as an attacker near the king, not on the board: a queen arriving is the
// whole attack, a pawn a nuisance. Kings are not counted.
static const int ATTACK_VALUE[KING] = {1, 2, 2, 3, 5};

// The weight of every enemy man whose reach touches the king or a square beside him.
static int attackers_on(EvalContext *ctx, Color color) {
	const Position *pos = ctx->pos;
	Square king = bb_first(pos->roles[KING] & pos->colors[color]);
	Bitboard ring = king_attacks(king) | square_bb(king);
	Bitboard enemies = pos->colors[opposite(color)] & ~pos->roles[KING];
	int attackers = 0;
	while (enemies != 0) {
		Square square = bb_pop(&enemies);
		attackers +=
		    (ctx->reach[square] & ring) != 0 ? ATTACK_VALUE[piece_role(pos->board[square])] : 0;
	}
	return attackers;
}

// `extractKing`: danger around our king minus around theirs.
void extract_king(EvalContext *ctx, float *features) {
	eval_walk(ctx);
	features[FEATURE_KING_DANGER] =
	    (float)(attackers_on(ctx, ctx->us) - attackers_on(ctx, ctx->them));
}
