#include <stdbool.h>

#include "bitboard.h"
#include "move.h"

static const char PROMOTIONS[] = " nbrq";

static bool parse_square(const char *text, Square *square) {
	if (text[0] < 'a' || text[0] > 'h' || text[1] < '1' || text[1] > '8') {
		return false;
	}
	*square = (Square)((text[0] - 'a') + (text[1] - '1') * 8);
	return true;
}

bool move_from_uci(const char *uci, Move *move) {
	Square from = 0;
	Square to = 0;
	if (!parse_square(uci, &from) || !parse_square(uci + 2, &to)) {
		return false;
	}
	Role promotion = PAWN;
	if (uci[4] != '\0') {
		for (int role = KNIGHT; role <= QUEEN; role++) {
			promotion = PROMOTIONS[role] == uci[4] ? (Role)role : promotion;
		}
		if (promotion == PAWN || uci[5] != '\0') {
			return false;
		}
	}
	*move = make_move(from, to, promotion);
	return true;
}

void move_to_uci(Move move, char *out) {
	Square squares[2] = {move_from(move), move_to(move)};
	for (int index = 0; index < 2; index++) {
		*out++ = (char)('a' + square_file(squares[index]));
		*out++ = (char)('1' + square_rank(squares[index]));
	}
	if (move_promotion(move) != PAWN) {
		*out++ = PROMOTIONS[move_promotion(move)];
	}
	*out = '\0';
}
