#include "api.h"
#include "attacks.h"
#include "position.h"

void engine_init(void) {
	zobrist_init();
	attacks_init();
}
