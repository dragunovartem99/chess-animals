#include <stdint.h>

#include "bitboard.h"
#include "position.h"
#include "zobrist.h"

uint64_t zobrist_pieces[PIECE_LIMIT][SQUARE_COUNT];
uint64_t zobrist_castling[16];
uint64_t zobrist_ep[SQUARE_COUNT + 1];
uint64_t zobrist_black;

// splitmix64: the keys only need to be well spread and the same on every build, and a generator
// at init keeps 800-odd constants out of the source.
static uint64_t next_key(uint64_t *state) {
	uint64_t z = (*state += 0x9e3779b97f4a7c15U);
	z = (z ^ (z >> 30)) * 0xbf58476d1ce4e5b9U;
	z = (z ^ (z >> 27)) * 0x94d049bb133111ebU;
	return z ^ (z >> 31);
}

// Keyed by square rather than by file for en passant, so SQUARE_NONE gets its own zero entry and
// hashing the square is a lookup rather than a branch.
void zobrist_init(void) {
	uint64_t state = 0x5a0b21575a0b2157U;
	for (Color color = WHITE; color <= BLACK; color++) {
		for (Role role = PAWN; role <= KING; role++) {
			for (int square = 0; square < SQUARE_COUNT; square++) {
				zobrist_pieces[make_piece(color, role)][square] = next_key(&state);
			}
		}
	}
	for (int rights = 1; rights < 16; rights++) {
		zobrist_castling[rights] = next_key(&state);
	}
	for (int square = 0; square < SQUARE_COUNT; square++) {
		zobrist_ep[square] = next_key(&state);
	}
	zobrist_black = next_key(&state);
}

uint64_t position_hash(const Position *pos) {
	uint64_t hash = zobrist_castling[pos->castling] ^ zobrist_ep[pos->ep];
	for (int square = 0; square < SQUARE_COUNT; square++) {
		hash ^= zobrist_pieces[pos->board[square]][square];
	}
	return pos->turn == BLACK ? hash ^ zobrist_black : hash;
}
