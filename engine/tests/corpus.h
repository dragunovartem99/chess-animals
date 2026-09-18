#ifndef ENGINE_TESTS_CORPUS_H
#define ENGINE_TESTS_CORPUS_H

#include <stdint.h>

#include "move.h"
#include "movegen.h"
#include "position.h"

// One line of `fixtures/moves.txt`, written by `npm run engine:corpus`: a position, a legal move
// in it, the position after, every legal move in chessops's order and perft(2).
typedef struct {
	char before[FEN_MAX];
	char uci[UCI_MAX];
	char after[FEN_MAX];
	char legal[MAX_MOVES * UCI_MAX];
	uint64_t perft2;
} CorpusLine;

// Calls `check` once per line and returns how many there were, so a spec can assert the fixture
// was actually read rather than passing on an empty file.
int corpus_each(void (*check)(const CorpusLine *line));

#endif
