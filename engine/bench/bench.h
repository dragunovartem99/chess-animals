#ifndef ENGINE_BENCH_H
#define ENGINE_BENCH_H

#include <stdint.h>

// chessprogramming.org's perft suite first, then four quieter positions from Stockfish's bench, so
// the search sees an ending and a closed middlegame as well as the movegen torture tests.
enum { PERFT_POSITIONS = 6, BENCH_POSITIONS = 10 };

extern const char *const BENCH_FENS[BENCH_POSITIONS];

// Wall-clock seconds, from an arbitrary origin.
double bench_seconds(void);

void bench_perft(void);
void bench_eval(void);

// Every roster animal over every position; returns the nodes searched, which is the signature.
uint64_t bench_search(void);

#endif
