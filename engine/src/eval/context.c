#include <stdbool.h>

#include "attacks.h"
#include "bitboard.h"
#include "eval.h"
#include "position.h"

EvalContext eval_context(const Position *pos) {
	return (EvalContext){.pos = pos, .us = pos->turn, .them = opposite(pos->turn)};
}

// A colour at a time, pawns first, so the pawn map is the running union once the pawns are done —
// the same order `walkBoard` takes, and the order families read `reach` in.
void eval_walk(EvalContext *ctx) {
	if (ctx->walked) {
		return;
	}
	const Position *pos = ctx->pos;
	Bitboard occupied = pos->colors[WHITE] | pos->colors[BLACK];
	for (Color color = WHITE; color <= BLACK; color++) {
		Bitboard all = 0;
		for (Role role = PAWN; role <= KING; role++) {
			for (Bitboard men = pos->roles[role] & pos->colors[color]; men != 0;) {
				Square square = bb_pop(&men);
				ctx->reach[square] = piece_attacks(make_piece(color, role), square, occupied);
				all |= ctx->reach[square];
			}
			ctx->pawn_attacks[color] = role == PAWN ? all : ctx->pawn_attacks[color];
		}
		ctx->attacks_by[color] = all;
	}
	ctx->walked = true;
}

double eval_phase(const Position *pos) {
	int units = bb_count(pos->roles[KNIGHT]) + bb_count(pos->roles[BISHOP]) +
	            bb_count(pos->roles[ROOK]) * 2 + bb_count(pos->roles[QUEEN]) * 4;
	return (units < 24 ? units : 24) / 24.0;
}
