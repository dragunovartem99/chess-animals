#ifndef ENGINE_TESTS_CORPUS_H
#define ENGINE_TESTS_CORPUS_H

#include "position.h"

// One line of `fixtures/moves.txt`, written by `npm run engine:corpus`: a position, a legal move
// in it and the position after, all as chessops plays them.
typedef struct {
	char before[FEN_MAX];
	char uci[UCI_MAX];
	char after[FEN_MAX];
} CorpusLine;

// Calls `check` once per line and returns how many there were, so a spec can assert the fixture
// was actually read rather than passing on an empty file.
int corpus_each(void (*check)(const CorpusLine *line));

#endif
