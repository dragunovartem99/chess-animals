#include <stdint.h>

#include "rng.h"

// No all-zero guard, unlike `seedState`: the finalizer is a bijection that fixes zero, so a word
// is zero only when `hash + (i + 1) * golden` wraps to zero, which holds for at most one word of
// the four. The TS guard never fires, and leaving it out keeps the streams identical.
Rng rng_seed(uint32_t hash) {
	Rng rng;
	for (int index = 0; index < 4; index++) {
		hash += 0x9e3779b9U;
		uint32_t word = hash;
		word = (word ^ (word >> 16)) * 0x21f0aaadU;
		word = (word ^ (word >> 15)) * 0x735a2d97U;
		rng.words[index] = word ^ (word >> 15);
	}
	return rng;
}

uint32_t rng_next(Rng *rng) {
	uint32_t first = rng->words[0];
	uint32_t carry = rng->words[3];

	rng->words[3] = rng->words[2];
	rng->words[2] = rng->words[1];
	rng->words[1] = first;

	carry ^= carry << 11;
	carry ^= carry >> 8;
	rng->words[0] = carry ^ first ^ (first >> 19);
	return rng->words[0];
}

double rng_float(Rng *rng) { return (double)rng_next(rng) / 4294967296.0; }

// Float first, then scale, in the TS order: the doubles and their rounding stay the same.
uint32_t rng_int(Rng *rng, uint32_t bound) { return (uint32_t)(rng_float(rng) * bound); }
