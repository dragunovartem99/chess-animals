#include <stdbool.h>
#include <stddef.h>

#include "api.h"
#include "bitboard.h"
#include "draw.h"
#include "eval.h"
#include "move.h"
#include "movegen.h"
#include "position.h"
#include "replay.h"

static bool is_legal(const Position *pos, Move move) {
	Move moves[MAX_MOVES];
	int count = generate_moves(pos, moves);
	for (int index = 0; index < count; index++) {
		if (moves[index] == move) {
			return true;
		}
	}
	return false;
}

// Cuts the text at the next separator and returns what follows it, or NULL at the end.
static char *cut(char *text, char separator) {
	while (*text != '\0' && *text != separator) {
		text++;
	}
	if (*text == '\0') {
		return NULL;
	}
	*text = '\0';
	return text + 1;
}

bool replay(Position *pos, History *history, Played *played) {
	char *text = io_text();
	text[IO_TEXT_SIZE - 1] = '\0';
	char *moves = cut(text, '\n');
	*played = (Played){.move = MOVE_NONE, .captured = NO_ROLE};
	history->length = 0;
	if (!position_from_fen(pos, text)) {
		return false;
	}
	while (moves != NULL && *moves != '\0') {
		char *uci = moves;
		moves = cut(moves, ' ');
		Move move = MOVE_NONE;
		if (!move_from_uci(uci, &move) || !is_legal(pos, move)) {
			return false;
		}
		*played = played_move(pos, move);
		history_push(history, pos->hash);
		Undo undo;
		position_make(pos, move, &undo);
	}
	return true;
}
