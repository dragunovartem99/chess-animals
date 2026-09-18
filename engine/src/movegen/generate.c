#include <stdbool.h>
#include <stdint.h>

#include "attacks.h"
#include "bitboard.h"
#include "move.h"
#include "movegen.h"
#include "position.h"

// Queen first, as chessops's `legalMoves` expands them.
static const Role PROMOTIONS[4] = {QUEEN, KNIGHT, ROOK, BISHOP};

// Which of a man's destinations change the material: a man taken, en passant, a promotion. The
// castling king's own rook is not one of them.
static Bitboard noisy_dests(const Position *pos, Square from, Bitboard dests, Bitboard last_rank) {
	Bitboard taken = dests & pos->colors[opposite(pos->turn)];
	if (piece_role(pos->board[from]) != PAWN) {
		return taken;
	}
	Bitboard ep = pos->ep == SQUARE_NONE ? 0 : square_bb(pos->ep);
	return taken | (dests & (last_rank | ep));
}

typedef enum { ALL, NOISY, QUIET } Kind;

static int generate(const Position *pos, Move *moves, Kind kind) {
	MoveContext ctx = move_context(pos);
	Bitboard last_rank = pos->turn == WHITE ? 0xff00000000000000U : 0xffU;
	int count = 0;
	for (Bitboard ours = pos->colors[pos->turn]; ours != 0;) {
		Square from = bb_pop(&ours);
		Bitboard dests = legal_dests(pos, &ctx, from);
		if (kind != ALL) {
			Bitboard noisy = noisy_dests(pos, from, dests, last_rank);
			dests = kind == NOISY ? noisy : dests & ~noisy;
		}
		Bitboard promoting = piece_role(pos->board[from]) == PAWN ? dests & last_rank : 0;
		while (dests != 0) {
			Square to = bb_pop(&dests);
			if (!bb_has(promoting, to)) {
				moves[count++] = make_move(from, to, PAWN);
				continue;
			}
			for (int index = 0; index < 4; index++) {
				moves[count++] = make_move(from, to, PROMOTIONS[index]);
			}
		}
	}
	return count;
}

int generate_moves(const Position *pos, Move *moves) { return generate(pos, moves, ALL); }
int generate_noisy(const Position *pos, Move *moves) { return generate(pos, moves, NOISY); }
int generate_quiet(const Position *pos, Move *moves) { return generate(pos, moves, QUIET); }

// The king first: it is the man likeliest to have a move and the only one that can answer double
// check, so most positions are settled by the first question.
bool has_legal_move(const Position *pos) {
	MoveContext ctx = move_context(pos);
	if (legal_dests(pos, &ctx, ctx.king) != 0) {
		return true;
	}
	if (bb_many(ctx.checkers)) {
		return false;
	}
	for (Bitboard men = pos->colors[pos->turn] & ~square_bb(ctx.king); men != 0;) {
		if (legal_dests(pos, &ctx, bb_pop(&men)) != 0) {
			return true;
		}
	}
	return false;
}

Square legal_ep_square(const Position *pos) {
	if (pos->ep == SQUARE_NONE) {
		return SQUARE_NONE;
	}
	MoveContext ctx = move_context(pos);
	Bitboard ours = pos->roles[PAWN] & pos->colors[pos->turn];
	for (Bitboard candidates = ours & pawn_attacks(opposite(pos->turn), pos->ep);
	     candidates != 0;) {
		if (bb_has(legal_dests(pos, &ctx, bb_pop(&candidates)), pos->ep)) {
			return pos->ep;
		}
	}
	return SQUARE_NONE;
}

// Counts the last ply without playing it: the moves generated are the leaves.
uint64_t perft(Position *pos, int depth) {
	Move moves[MAX_MOVES];
	int count = generate_moves(pos, moves);
	if (depth <= 1) {
		return depth == 1 ? (uint64_t)count : 1;
	}
	uint64_t nodes = 0;
	for (int index = 0; index < count; index++) {
		Undo undo;
		position_make(pos, moves[index], &undo);
		nodes += perft(pos, depth - 1);
		position_unmake(pos, moves[index], &undo);
	}
	return nodes;
}
