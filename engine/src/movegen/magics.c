#include <stdint.h>

#include "attacks.h"
#include "bitboard.h"
#include "movegen.h"

Magic bishop_magics[SQUARE_COUNT];
Magic rook_magics[SQUARE_COUNT];

// Sized for fancy magics: every square's table holds 2^(relevant blockers) sets, and these are
// the sums over the board — 5248 for bishops, 102400 for rooks.
static Bitboard bishop_table[5248];
static Bitboard rook_table[102400];

static const Step BISHOP_RAYS[4] = {{1, 1}, {1, -1}, {-1, -1}, {-1, 1}};
static const Step ROOK_RAYS[4] = {{1, 0}, {0, -1}, {-1, 0}, {0, 1}};

// The slow walk the tables stand in for: along each ray until the edge or the first blocker,
// which is attacked too.
static Bitboard slide(Square square, const Step rays[4], Bitboard occupied) {
	Bitboard bb = 0;
	for (int ray = 0; ray < 4; ray++) {
		Square at = square;
		for (Bitboard next = step_bb(at, rays[ray]); next != 0; next = step_bb(at, rays[ray])) {
			bb |= next;
			at = bb_first(next);
			if (occupied & next) {
				break;
			}
		}
	}
	return bb;
}

// Stockfish's xorshift64* and per-rank seeds; sparse candidates (three draws ANDed) make good
// magics far likelier. The search tries ~200k candidates, ~30 ms once per worker in wasm and
// natively alike — paid at startup, off the main thread, to keep 128 opaque constants out of
// the source.
static uint64_t next_candidate(uint64_t *state) {
	uint64_t candidate = ~(uint64_t)0;
	for (int draw = 0; draw < 3; draw++) {
		*state ^= *state >> 12;
		*state ^= *state << 25;
		*state ^= *state >> 27;
		candidate &= *state * 2685821657736338717U;
	}
	return candidate;
}

static const uint64_t SEEDS[8] = {728, 10316, 55013, 32803, 12281, 15100, 16645, 255};

// Scratch for one square: every blocker subset and the attacks it gives, plus the attempt that
// last wrote each table slot, so a failed magic needs no clearing pass.
static Bitboard subsets[4096];
static Bitboard references[4096];
static unsigned attempts[4096];

static void find_magic(Magic *magic, Bitboard *table, Square square, const Step rays[4]) {
	static unsigned attempt;
	Bitboard edges = ((0xff000000000000ffU & ~((Bitboard)0xff << (square_rank(square) * 8))) |
	                  (0x8181818181818181U & ~(0x0101010101010101U << square_file(square))));
	magic->mask = slide(square, rays, 0) & ~edges;
	magic->shift = (unsigned)(64 - bb_count(magic->mask));
	magic->table = table;

	int size = 0;
	Bitboard subset = 0;
	do {
		subsets[size] = subset;
		references[size++] = slide(square, rays, subset);
		subset = (subset - magic->mask) & magic->mask;
	} while (subset != 0);

	uint64_t state = SEEDS[square_rank(square)];
	for (int index = 0; index < size;) {
		do {
			magic->magic = next_candidate(&state);
		} while (bb_count((magic->magic * magic->mask) >> 56) < 6);
		for (attempt++, index = 0; index < size; index++) {
			uint64_t slot = ((subsets[index] & magic->mask) * magic->magic) >> magic->shift;
			if (attempts[slot] < attempt) {
				attempts[slot] = attempt;
				table[slot] = references[index];
			} else if (table[slot] != references[index]) {
				break;
			}
		}
	}
}

void magics_init(void) {
	Bitboard *bishop_next = bishop_table;
	Bitboard *rook_next = rook_table;
	for (int index = 0; index < SQUARE_COUNT; index++) {
		Square square = (Square)index;
		find_magic(&bishop_magics[square], bishop_next, square, BISHOP_RAYS);
		bishop_next += (Bitboard)1 << (64 - bishop_magics[square].shift);
		find_magic(&rook_magics[square], rook_next, square, ROOK_RAYS);
		rook_next += (Bitboard)1 << (64 - rook_magics[square].shift);
	}
}
