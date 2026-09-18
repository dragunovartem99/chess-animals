#ifndef ENGINE_BOARD_FEN_H
#define ENGINE_BOARD_FEN_H

#include <stddef.h>
#include <stdint.h>

#include "position.h"

// Each reads one FEN field and returns where it stopped, or NULL when the field is malformed —
// so the caller chains them and checks once.
const char *parse_board(Position *pos, const char *c);
const char *parse_castling(Position *pos, const char *c);
const char *parse_ep(Position *pos, const char *c);
const char *parse_counter(const char *c, uint32_t *value);

#endif
