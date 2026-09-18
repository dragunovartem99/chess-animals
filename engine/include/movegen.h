#ifndef ENGINE_MOVEGEN_H
#define ENGINE_MOVEGEN_H

#include <stdbool.h>
#include <stdint.h>

#include "bitboard.h"
#include "move.h"
#include "position.h"

// 218 is the most legal moves any reachable position has; the rest is headroom.
enum { MAX_MOVES = 256 };

// chessops's `ctx()`: worked out once per position and shared by every piece's destinations.
// `blockers` holds the one man standing between the king and each enemy slider on a line to it —
// ours are pinned, theirs are discovered-check candidates.
typedef struct {
	Square king;
	Bitboard checkers;
	Bitboard blockers;
} MoveContext;

MoveContext move_context(const Position *pos);

// Every man of `attacker`'s that attacks `square` given `occupied`, which may differ from the
// board's — the king's safety is asked with the king itself lifted off.
Bitboard attackers_to(const Position *pos, Square square, Color attacker, Bitboard occupied);

// chessops's `dests`: the legal destinations of the man on `from`, castling as the rook's square.
Bitboard legal_dests(const Position *pos, const MoveContext *ctx, Square from);
Bitboard castling_dests(const Position *pos, const MoveContext *ctx);

// Every legal move in chessops's `legalMoves` order — from-square ascending, then to-square
// ascending, promotions as Q N R B — into `moves`, which holds MAX_MOVES. Returns the count.
int generate_moves(const Position *pos, Move *moves);

// `generate_moves` split in two, each part in its order: the moves that change the material —
// captures, en passant, promotions — and the rest. A search that cuts on a capture never lists
// the quiet moves, and quiescence never lists them at all.
int generate_noisy(const Position *pos, Move *moves);
int generate_quiet(const Position *pos, Move *moves);

// Whether `generate_moves` would list `move`.
bool is_legal_move(const Position *pos, Move move);

// Whether `generate_moves` would return any move, without listing them: the leaf only needs to
// tell mate and stalemate from a position that plays on, and nearly every position does.
bool has_legal_move(const Position *pos);

// chessops's `legalEpSquare`: the en passant square only when a capture onto it is legal, which
// is what a FEN writes and a repetition compares.
Square legal_ep_square(const Position *pos);

// Leaf positions `depth` plies down; the move generator's standard correctness check.
uint64_t perft(Position *pos, int depth);

#endif
