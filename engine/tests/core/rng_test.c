#include <stdint.h>

#include "harness.h"
#include "rng.h"

// Every expected value below was printed by the TS `createRng` for the same seed.
static void check_stream(uint32_t seed, const uint32_t expected[6]) {
	Rng rng = rng_seed(seed);
	for (int index = 0; index < 6; index++) {
		CHECK(rng_next(&rng) == expected[index]);
	}
}

TEST(matches_create_rng_for_a_zero_seed) {
	check_stream(0, (const uint32_t[]){1606002101U, 1105282812U, 2604129221U, 3986877265U,
	                                   2141482845U, 876155123U});
}

TEST(matches_create_rng_for_a_small_seed) {
	check_stream(42, (const uint32_t[]){2291129162U, 1449700124U, 4078029891U, 4055367345U,
	                                    118767174U, 339166707U});
}

TEST(matches_create_rng_for_the_largest_seed) {
	check_stream(UINT32_MAX, (const uint32_t[]){1631134853U, 965022900U, 2201882541U, 4174628108U,
	                                            1348914079U, 1096242579U});
}

TEST(matches_create_rng_float) {
	Rng rng = rng_seed(7);
	CHECK(rng_float(&rng) == 0.37712098285555840);
}

TEST(matches_create_rng_int_across_bounds) {
	const uint32_t bounds[] = {1, 2, 3, 20, 20, 218, 1000, UINT32_MAX};
	const uint32_t expected[] = {0, 0, 0, 17, 17, 74, 870, 2573197917U};
	Rng rng = rng_seed(7);
	for (int index = 0; index < 8; index++) {
		CHECK(rng_int(&rng, bounds[index]) == expected[index]);
	}
}
