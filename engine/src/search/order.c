#include <stdbool.h>

#include "bitboard.h"
#include "move.h"
#include "movegen.h"
#include "node.h"
#include "position.h"
#include "search.h"
#include "values.h"

// Every capture and promotion sorts above every killer, and a killer above any other quiet move.
enum { NOISY = 1000, FIRST_KILLER = 500, SECOND_KILLER = 499 };

bool is_capture(const Position *pos, Move move) {
	Piece target = pos->board[move_to(move)];
	if (target != PIECE_NONE) {
		return piece_color(target) != pos->turn;
	}
	// A pawn onto the en passant square is always a capture: straight ahead of it stands the pawn
	// that just passed over it.
	return piece_role(pos->board[move_from(move)]) == PAWN && move_to(move) == pos->ep;
}

// Most valuable victim, least valuable attacker — take the queen with the pawn before the pawn
// with the queen — and a promotion priced by what the pawn becomes.
static int priority(const Search *search, const Position *pos, Move move, int ply) {
	Role promotion = move_promotion(move);
	int score = promotion == PAWN ? 0 : NOISY + 10 * classical_value(promotion);
	if (is_capture(pos, move)) {
		Piece victim = pos->board[move_to(move)];
		Role taken = victim == PIECE_NONE ? PAWN : piece_role(victim);
		Role attacker = piece_role(pos->board[move_from(move)]);
		return score + NOISY + 10 * classical_value(taken) - classical_value(attacker);
	}
	if (score != 0) {
		return score;
	}
	if (move == search->killers[ply][0]) {
		return FIRST_KILLER;
	}
	return move == search->killers[ply][1] ? SECOND_KILLER : 0;
}

// Insertion sort: most positions have no capture and no killer, so every priority is zero and the
// pass shifts nothing. Only a strictly greater priority moves left, which keeps it stable.
void order_moves(const Search *search, const Position *pos, Move *moves, int count, int ply) {
	int priorities[MAX_MOVES];
	for (int index = 0; index < count; index++) {
		priorities[index] = priority(search, pos, moves[index], ply);
	}
	for (int index = 1; index < count; index++) {
		Move move = moves[index];
		int value = priorities[index];
		int slot = index - 1;
		while (slot >= 0 && priorities[slot] < value) {
			moves[slot + 1] = moves[slot];
			priorities[slot + 1] = priorities[slot];
			slot--;
		}
		moves[slot + 1] = move;
		priorities[slot + 1] = value;
	}
}
