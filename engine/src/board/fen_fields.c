#include <stddef.h>
#include <stdint.h>

#include "bitboard.h"
#include "fen.h"
#include "pieces.h"
#include "position.h"

static const char PIECE_CHARS[2][7] = {"PNBRQK", "pnbrqk"};

// In CASTLE_* bit order.
static const char RIGHTS[] = "KQkq";

static int role_of(char c) {
	for (int role = PAWN; role <= KING; role++) {
		if (c == PIECE_CHARS[WHITE][role] || c == PIECE_CHARS[BLACK][role]) {
			return role;
		}
	}
	return -1;
}

const char *parse_board(Position *pos, const char *c) {
	int rank = 7;
	int file = 0;
	for (; *c != ' '; c++) {
		int role = role_of(*c);
		if (*c == '/' && file == 8 && rank > 0) {
			rank--;
			file = 0;
		} else if (*c >= '1' && *c <= '8' && file + (*c - '0') <= 8) {
			file += *c - '0';
		} else if (role >= 0 && file < 8) {
			Color color = *c >= 'a' ? BLACK : WHITE;
			put_piece(pos, (Square)(rank * 8 + file++), make_piece(color, (Role)role));
		} else {
			return NULL;
		}
	}
	return rank == 0 && file == 8 ? c : NULL;
}

const char *parse_castling(Position *pos, const char *c) {
	if (*c == '-') {
		return c + 1;
	}
	const char *start = c;
	for (; *c != ' ' && *c != '\0'; c++) {
		int index = 0;
		while (RIGHTS[index] != '\0' && RIGHTS[index] != *c) {
			index++;
		}
		if (RIGHTS[index] == '\0') {
			return NULL;
		}
		pos->castling |= (uint8_t)(1U << index);
	}
	return c == start ? NULL : c;
}

// chessops's `validEpSquare` drops a square no pawn can just have passed over: it must be on the
// right rank, with nothing beyond it and the enemy pawn right in front.
const char *parse_ep(Position *pos, const char *c) {
	if (*c == '-') {
		return c + 1;
	}
	int ep_rank = pos->turn == WHITE ? 5 : 2;
	if (c[0] < 'a' || c[0] > 'h' || c[1] != '1' + ep_rank) {
		return c[0] >= 'a' && c[0] <= 'h' && c[1] >= '1' && c[1] <= '8' ? c + 2 : NULL;
	}
	int forward = pos->turn == WHITE ? 8 : -8;
	Square square = (Square)(ep_rank * 8 + c[0] - 'a');
	if (pos->board[square + forward] == PIECE_NONE &&
	    pos->board[square - forward] == make_piece(opposite(pos->turn), PAWN)) {
		pos->ep = square;
	}
	return c + 2;
}

const char *parse_counter(const char *c, uint32_t *value) {
	const char *start = c;
	*value = 0;
	for (; *c >= '0' && *c <= '9' && c - start < 5; c++) {
		*value = *value * 10 + (uint32_t)(*c - '0');
	}
	return c == start ? NULL : c;
}
