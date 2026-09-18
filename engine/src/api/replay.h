#ifndef ENGINE_API_REPLAY_H
#define ENGINE_API_REPLAY_H

#include <stdbool.h>

#include "draw.h"
#include "eval.h"
#include "position.h"

// The game `io_text` describes, played out: the position it reaches, every position before it in
// `history` for the repetition test, and the last move as `played` — `move` MOVE_NONE when there
// was none. False when the FEN does not parse or a move is not legal where it is played. Consumes
// the text, which the caller overwrites with its answer anyway.
bool replay(Position *pos, History *history, Played *played);

#endif
