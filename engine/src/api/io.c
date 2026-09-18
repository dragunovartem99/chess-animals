#include <stdint.h>

#include "api.h"
#include "feature_ids.h"

static char text[IO_TEXT_SIZE];
static float weights[FEATURE_COUNT];
static float features[FEATURE_COUNT];
static uint32_t rng[4];
static double result[2];

char *io_text(void) { return text; }
float *io_weights(void) { return weights; }
float *io_features(void) { return features; }
uint32_t *io_rng(void) { return rng; }
double *io_result(void) { return result; }
