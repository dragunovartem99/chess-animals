#include <stdint.h>

#include "attacks.h"
#include "bitboard.h"
#include "move.h"
#include "movegen.h"
#include "position.h"

// Queen first, as chessops's `legalMoves` expands them.
static const Role PROMOTIONS[4] = {QUEEN, KNIGHT, ROOK, BISHOP};

int generate_moves(const Position *pos, Move *moves) {
	MoveContext ctx = move_context(pos);
	Bitboard last_rank = pos->turn == WHITE ? 0xff00000000000000U : 0xffU;
	int count = 0;
	for (Bitboard ours = pos->colors[pos->turn]; ours != 0;) {
		Square from = bb_pop(&ours);
		Bitboard dests = legal_dests(pos, &ctx, from);
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
