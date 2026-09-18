#ifndef ENGINE_RNG_H
#define ENGINE_RNG_H

#include <stdint.h>

// The same xorshift128 as `createRng`, word for word: the state round-trips across the wasm
// boundary, so TS and C draw from one stream rather than two that drift apart.
typedef struct {
	uint32_t words[4];
} Rng;

// `seedState` from the point the seed is one word: a number seed as is, a string one after its
// FNV-1a hash, which stays on the TS side.
Rng rng_seed(uint32_t hash);

uint32_t rng_next(Rng *rng);

// A uniform float in [0, 1).
double rng_float(Rng *rng);

// A uniform integer in [0, bound), by multiply-and-floor like `Rng.int`, bias and all.
uint32_t rng_int(Rng *rng, uint32_t bound);

#endif
