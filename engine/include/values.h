#ifndef ENGINE_VALUES_H
#define ENGINE_VALUES_H

#include "bitboard.h"

// `CLASSICAL_VALUES`, in pawns: for decisions that are not an evaluation — `offeredMaterial`,
// `captureValue` and move ordering. Deliberately not the tunable material weights, so retuning a
// bot's piece values never re-sorts its move list. A king is zero: it is never taken.
static inline int classical_value(Role role) {
	static const int VALUES[ROLE_COUNT] = {1, 3, 3, 5, 9, 0};
	return VALUES[role];
}

#endif
