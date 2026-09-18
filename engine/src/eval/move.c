#include <stddef.h>

#include "bitboard.h"
#include "eval.h"
#include "families.h"
#include "feature_ids.h"
#include "move.h"
#include "movegen.h"
#include "position.h"
#include "values.h"

Played played_move(const Position *parent, Move move) {
	Piece target = parent->board[move_to(move)];
	bool en_passant =
	    piece_role(parent->board[move_from(move)]) == PAWN && move_to(move) == parent->ep;
	if (target != PIECE_NONE) {
		return (Played){.move = move, .captured = piece_role(target)};
	}
	return (Played){.move = move, .captured = en_passant ? PAWN : NO_ROLE};
}

// `extractMoveFeatures`: what the move did, negated into the frame of the side now to move, so a
// positive weight always means the mover wants it.
void extract_move(const Position *pos, const Played *played, float *features) {
	if (played == NULL) {
		return;
	}
	Square king = bb_first(pos->roles[KING] & pos->colors[pos->turn]);
	Bitboard occupied = pos->colors[WHITE] | pos->colors[BLACK];
	if (attackers_to(pos, king, opposite(pos->turn), occupied) != 0) {
		features[FEATURE_GIVES_CHECK] = -1;
	}
	if (played->captured != NO_ROLE) {
		features[FEATURE_CAPTURE_VALUE] = (float)-classical_value(played->captured);
	}
}
