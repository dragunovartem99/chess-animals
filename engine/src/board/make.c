#include <stdbool.h>
#include <stdint.h>

#include "bitboard.h"
#include "move.h"
#include "pieces.h"
#include "position.h"
#include "zobrist.h"

enum { A1 = 0, H1 = 7, E1 = 4, A8 = 56, E8 = 60, H8 = 63 };

// The rights a move gives up by touching a square — leaving it or capturing on it. A king or rook
// that still holds a right stands on its home square, so the square alone says which is lost.
static uint8_t rights_lost(Square square) {
	switch (square) {
	case A1:
		return CASTLE_WHITE_A;
	case H1:
		return CASTLE_WHITE_H;
	case E1:
		return CASTLE_WHITE_A | CASTLE_WHITE_H;
	case A8:
		return CASTLE_BLACK_A;
	case H8:
		return CASTLE_BLACK_H;
	case E8:
		return CASTLE_BLACK_A | CASTLE_BLACK_H;
	default:
		return 0;
	}
}

// chessops's `castlingSide`: a king stepping two files, or onto a man of its own colour.
static bool is_castling(const Position *pos, Square from, Square to) {
	return piece_role(pos->board[from]) == KING &&
	       (from - to == 2 || to - from == 2 || bb_has(pos->colors[pos->turn], to));
}

static void castle(Position *pos, Square from, Square to, bool undo) {
	bool h_side = to > from;
	Square rook_from = h_side ? from + 3 : from - 4;
	Square king_to = h_side ? from + 2 : from - 2;
	Square rook_to = h_side ? from + 1 : from - 1;
	Piece king = take_piece(pos, undo ? king_to : from);
	Piece rook = take_piece(pos, undo ? rook_to : rook_from);
	put_piece(pos, undo ? from : king_to, king);
	put_piece(pos, undo ? rook_from : rook_to, rook);
}

static void move_piece(Position *pos, Move move, Undo *undo) {
	Square from = move_from(move);
	Square to = move_to(move);
	Piece piece = pos->board[from];
	// A pawn landing on the en passant square takes the one that passed it, a rank behind.
	Square target = piece_role(piece) == PAWN && to == undo->ep ? to ^ 8 : to;
	if (piece_role(piece) == PAWN) {
		pos->halfmoves = 0;
		pos->ep = (from - to == 16 || to - from == 16) ? (Square)((from + to) / 2) : SQUARE_NONE;
	}
	if (pos->board[target] != PIECE_NONE) {
		undo->captured = take_piece(pos, target);
		pos->halfmoves = 0;
	}
	take_piece(pos, from);
	Role promotion = move_promotion(move);
	put_piece(pos, to, promotion == PAWN ? piece : make_piece(pos->turn, promotion));
}

void position_make(Position *pos, Move move, Undo *undo) {
	*undo = (Undo){.hash = pos->hash,
	               .halfmoves = pos->halfmoves,
	               .fullmoves = pos->fullmoves,
	               .ep = pos->ep,
	               .castling = pos->castling,
	               .castled = is_castling(pos, move_from(move), move_to(move))};
	pos->halfmoves++;
	pos->fullmoves += pos->turn == BLACK;
	pos->ep = SQUARE_NONE;
	if (undo->castled) {
		castle(pos, move_from(move), move_to(move), false);
	} else {
		move_piece(pos, move, undo);
	}
	pos->castling &= (uint8_t)~(rights_lost(move_from(move)) | rights_lost(move_to(move)));
	pos->hash ^= zobrist_castling[undo->castling] ^ zobrist_castling[pos->castling] ^
	             zobrist_ep[undo->ep] ^ zobrist_ep[pos->ep] ^ zobrist_black;
	pos->turn = opposite(pos->turn);
}

void position_unmake(Position *pos, Move move, const Undo *undo) {
	pos->turn = opposite(pos->turn);
	Square from = move_from(move);
	Square to = move_to(move);
	if (undo->castled) {
		castle(pos, from, to, true);
	} else {
		Piece piece = take_piece(pos, to);
		put_piece(pos, from, move_promotion(move) == PAWN ? piece : make_piece(pos->turn, PAWN));
		if (undo->captured != PIECE_NONE) {
			bool en_passant = piece_role(piece) == PAWN && to == undo->ep;
			put_piece(pos, en_passant ? to ^ 8 : to, undo->captured);
		}
	}
	pos->hash = undo->hash;
	pos->halfmoves = undo->halfmoves;
	pos->fullmoves = undo->fullmoves;
	pos->ep = undo->ep;
	pos->castling = undo->castling;
}
