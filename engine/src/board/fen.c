#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#include "bitboard.h"
#include "fen.h"
#include "position.h"

static const Bitboard BACK_RANKS = 0xff000000000000ffU;

static const char PIECE_CHARS[2][7] = {"PNBRQK", "pnbrqk"};

// chessops's `fromSetup` also rejects a side not to move that stands in check; that needs attack
// tables, and a FEN reaching here has already been through chessops on the TS side.
static bool is_valid(const Position *pos) {
	Bitboard kings = pos->roles[KING];
	return bb_count(kings & pos->colors[WHITE]) == 1 && bb_count(kings & pos->colors[BLACK]) == 1 &&
	       (pos->roles[PAWN] & BACK_RANKS) == 0;
}

// chessops's `Castles.fromSetup` for standard chess: a right needs its king and its rook home.
static void drop_unbacked_rights(Position *pos) {
	static const Square ROOKS[4] = {7, 0, 63, 56};
	for (int index = 0; index < 4; index++) {
		Color color = index < 2 ? WHITE : BLACK;
		if (pos->board[ROOKS[index]] != make_piece(color, ROOK) ||
		    pos->board[color == WHITE ? 4 : 60] != make_piece(color, KING)) {
			pos->castling &= (uint8_t)~(1U << index);
		}
	}
}

bool position_from_fen(Position *pos, const char *fen) {
	*pos = (Position){.fullmoves = 1, .ep = SQUARE_NONE};
	const char *c = parse_board(pos, fen);
	if (c == NULL || (c[1] != 'w' && c[1] != 'b') || c[2] != ' ') {
		return false;
	}
	pos->turn = c[1] == 'b' ? BLACK : WHITE;
	c = parse_castling(pos, c + 3);
	c = c != NULL && *c == ' ' ? parse_ep(pos, c + 1) : NULL;
	c = c != NULL && *c == ' ' ? parse_counter(c + 1, &pos->halfmoves) : c;
	c = c != NULL && *c == ' ' ? parse_counter(c + 1, &pos->fullmoves) : c;
	if (c == NULL || *c != '\0' || !is_valid(pos)) {
		return false;
	}
	drop_unbacked_rights(pos);
	pos->hash = position_hash(pos);
	return true;
}

static char *write_number(char *out, uint32_t value) {
	char digits[10];
	int count = 0;
	do {
		digits[count++] = (char)('0' + value % 10);
		value /= 10;
	} while (value > 0);
	while (count > 0) {
		*out++ = digits[--count];
	}
	return out;
}

static char *write_board(const Position *pos, char *out) {
	for (int rank = 7; rank >= 0; rank--) {
		int empty = 0;
		for (int file = 0; file < 8; file++) {
			Piece piece = pos->board[rank * 8 + file];
			if (piece == PIECE_NONE) {
				empty++;
				continue;
			}
			out = empty > 0 ? write_number(out, (uint32_t)empty) : out;
			empty = 0;
			*out++ = PIECE_CHARS[piece_color(piece)][piece_role(piece)];
		}
		out = empty > 0 ? write_number(out, (uint32_t)empty) : out;
		*out++ = rank > 0 ? '/' : ' ';
	}
	return out;
}

// The counters are clamped as `makeFen(position.toSetup())` clamps them: halfmoves to 150,
// fullmoves to 1..9999.
void position_to_fen(const Position *pos, char *out) {
	out = write_board(pos, out);
	*out++ = pos->turn == WHITE ? 'w' : 'b';
	*out++ = ' ';
	for (int index = 0; index < 4; index++) {
		*out = "KQkq"[index];
		out += (pos->castling >> index) & 1;
	}
	*out = '-';
	out += pos->castling == 0;
	*out++ = ' ';
	if (pos->ep == SQUARE_NONE) {
		*out++ = '-';
	} else {
		*out++ = (char)('a' + square_file(pos->ep));
		*out++ = (char)('1' + square_rank(pos->ep));
	}
	*out++ = ' ';
	out = write_number(out, pos->halfmoves < 150 ? pos->halfmoves : 150);
	*out++ = ' ';
	uint32_t fullmoves = pos->fullmoves < 1 ? 1 : pos->fullmoves;
	out = write_number(out, fullmoves < 9999 ? fullmoves : 9999);
	*out = '\0';
}
