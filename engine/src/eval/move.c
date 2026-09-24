#include <stddef.h>

#include "bitboard.h"
#include "eval.h"
#include "extractors.h"
#include "move.h"
#include "movegen.h"
#include "position.h"
#include "values.h"

// What a move took. Only a piece of the other side: castling lands the king on its own rook, the
// way chessops spells it, and that is a move, not a capture.
Played played_move(const Position *parent, Move move) {
	Piece mover = parent->board[move_from(move)];
	Piece target = parent->board[move_to(move)];
	bool en_passant = piece_role(mover) == PAWN && move_to(move) == parent->ep;
	if (target != PIECE_NONE && piece_color(target) != piece_color(mover)) {
		return (Played){.move = move, .captured = piece_role(target)};
	}
	return (Played){.move = move, .captured = en_passant ? PAWN : NO_ROLE};
}

// What the move did, negated into the frame of the side now to move, so a positive weight always
// means the mover wants it. Each reads zero at a root, where no move was played.
float extract_gives_check(EvalContext *ctx) {
	const Position *pos = ctx->pos;
	if (ctx->played == NULL) {
		return 0;
	}
	Square king = bb_first(pos->roles[KING] & pos->colors[ctx->us]);
	Bitboard occupied = pos->colors[WHITE] | pos->colors[BLACK];
	return attackers_to(pos, king, ctx->them, occupied) != 0 ? -1 : 0;
}

float extract_capture_value(EvalContext *ctx) {
	if (ctx->played == NULL || ctx->played->captured == NO_ROLE) {
		return 0;
	}
	return (float)-classical_value(ctx->played->captured);
}

// Always zero: a mate replaces the evaluation in `terminal_score` rather than joining the dot, and
// the slot exists only to carry the weight that signs it.
float extract_gives_mate(EvalContext *ctx) {
	(void)ctx;
	return 0;
}
