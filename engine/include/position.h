#ifndef ENGINE_POSITION_H
#define ENGINE_POSITION_H

#include <stdbool.h>
#include <stdint.h>

#include "bitboard.h"
#include "move.h"

// 0 is an empty square; otherwise colour << 3 | (role + 1), so a piece indexes a table directly.
typedef uint8_t Piece;

enum { PIECE_NONE = 0, PIECE_LIMIT = 16, SQUARE_NONE = 64, FEN_MAX = 128 };

static inline Piece make_piece(Color color, Role role) {
	return (Piece)((unsigned)color << 3 | (unsigned)(role + 1));
}
static inline Role piece_role(Piece piece) { return (Role)((piece & 7) - 1); }
static inline Color piece_color(Piece piece) { return (Color)(piece >> 3); }

// One bit per rook that may still castle. Standard chess only: the rooks start in the corners and
// the king on the e-file, which is all the openings and the app ever set up.
enum { CASTLE_WHITE_H = 1, CASTLE_WHITE_A = 2, CASTLE_BLACK_H = 4, CASTLE_BLACK_A = 8 };

// Bitboards for set arithmetic beside a mailbox for "what stands here" in one load. `ep` is
// chessops's own: set on every double push whether or not a capture onto it is legal.
typedef struct {
	Bitboard colors[COLOR_COUNT];
	Bitboard roles[ROLE_COUNT];
	Piece board[SQUARE_COUNT];
	uint64_t hash;
	uint32_t halfmoves;
	uint32_t fullmoves;
	Color turn;
	Square ep;
	uint8_t castling;
} Position;

// What make destroys and unmake cannot work out from the move. The caller keeps one per ply, so
// nothing is allocated and the stack is exactly as deep as the search.
typedef struct {
	uint64_t hash;
	uint32_t halfmoves;
	uint32_t fullmoves;
	Square ep;
	uint8_t castling;
	Piece captured;
	bool castled;
} Undo;

// Fills the Zobrist keys; `engine_init` calls it once, before any position exists.
void zobrist_init(void);

// The hash computed from scratch — what make and unmake keep incrementally, and the check on them.
uint64_t position_hash(const Position *pos);

// Parses a FEN as chessops's `parseFen` + `Chess.fromSetup` do for standard chess: missing
// counters default to 0 and 1, castling rights without their king and rook are dropped, and so
// is an en passant square no pawn could just have passed over.
bool position_from_fen(Position *pos, const char *fen);

// Writes the FEN and a terminating NUL into `out`, which holds at least FEN_MAX bytes.
void position_to_fen(const Position *pos, char *out);

// Plays a move chessops would accept, castling given as either king-takes-rook or the king's own
// two-square step. Legality is the caller's.
void position_make(Position *pos, Move move, Undo *undo);
void position_unmake(Position *pos, Move move, const Undo *undo);

#endif
