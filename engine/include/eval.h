#ifndef ENGINE_EVAL_H
#define ENGINE_EVAL_H

#include <stdbool.h>

#include "bitboard.h"
#include "feature_ids.h"
#include "move.h"
#include "position.h"

// What more than one family reads, worked out once per position — `createContext`. `us` is the
// side to move: the whole evaluation is written from that seat, so no feature is colour-specific.
//
// The attack maps are lazy, as in TS: most families only count men or read their squares, so the
// walk that fills them runs only when a family first asks, through `eval_walk`.
typedef struct {
	const Position *pos;
	Color us;
	Color them;
	bool walked;
	// What the man on each square attacks; zero on an empty square.
	Bitboard reach[SQUARE_COUNT];
	// Squares each side's pawns attack, and squares each side attacks with anything at all.
	Bitboard pawn_attacks[COLOR_COUNT];
	Bitboard attacks_by[COLOR_COUNT];
} EvalContext;

EvalContext eval_context(const Position *pos);

// Fills the attack maps the first time it is called and does nothing after.
void eval_walk(EvalContext *ctx);

// Non-pawn material left, 1 at the start down to 0 with bare kings and pawns: minors count 1, a
// rook 2, a queen 4, out of 24, capped so an extra queen does not read as earlier than the start.
double eval_phase(const Position *pos);

// `PlayedMove`: the move that produced a position, and the role it took — read off the parent
// before the move is made, since the search makes and unmakes rather than keeping the parent.
typedef struct {
	Move move;
	Role captured;
} Played;

// chessops's `capturedRole`: the role on the target square, or the pawn an en passant capture
// takes. Castling is king-takes-rook, so it reads the mover's own rook — a quirk the TS feature
// has too, kept until both are fixed together.
Played played_move(const Position *parent, Move move);

// Every feature, from the side to move's seat, into `features` (FEATURE_COUNT floats, zeroed
// first). `played` is NULL at a root, where the move family reads zero. Float rather than double
// because the TS vector is a Float32Array, and a bit-identical feature is rounded where it is.
void extract_features(const Position *pos, const Played *played, float *features);

#endif
