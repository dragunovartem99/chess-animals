#ifndef ENGINE_API_H
#define ENGINE_API_H

#include <stdint.h>

// Bumped whenever an export's signature or the linear-memory layout changes: the TS binding
// checks it at load, so a stale engine.wasm fails loudly instead of misreading memory.
#define ENGINE_ABI_VERSION 2

// Named exports rather than `--export-all`: the module's surface is exactly what is marked here.
#ifdef __wasm__
#define ENGINE_EXPORT(name) __attribute__((export_name(#name)))
#else
#define ENGINE_EXPORT(name)
#endif

// A FEN, a newline and the moves played from it, space-separated in chessops's UCI — castling as
// the king taking its rook, `e1h1`. Room for a game of a few thousand plies.
enum { IO_TEXT_SIZE = 16384 };

ENGINE_EXPORT(abi_version) uint32_t abi_version(void);

// Builds every table the engine reads — Zobrist keys and attack tables. Called once, before
// anything else; the build does no allocation, so this is the only setup there is.
ENGINE_EXPORT(engine_init) void engine_init(void);

// The linear-memory arena the binding writes a request into and reads the answer out of: fixed
// buffers, found once through these, so a call passes only scalars and never allocates.
ENGINE_EXPORT(io_text) char *io_text(void);
ENGINE_EXPORT(io_weights) float *io_weights(void);
ENGINE_EXPORT(io_features) float *io_features(void);
// The xorshift128 state, read before a shuffled search and written back after it.
ENGINE_EXPORT(io_rng) uint32_t *io_rng(void);
// The score, then the nodes: doubles, since a node count in an i64 would reach JS as a BigInt.
ENGINE_EXPORT(io_result) double *io_result(void);

// Searches the game in `io_text` with `io_weights`, `node_limit` 0 meaning none and `shuffle`
// drawing the root's order from `io_rng`. Writes the move to `io_text` — empty when the game is
// over — and returns 1, or returns 0 when the FEN does not parse or a move is illegal.
ENGINE_EXPORT(engine_search)
int32_t engine_search(uint32_t depth, uint32_t quiescence, uint32_t node_limit, uint32_t shuffle);

// Every feature of the position the game in `io_text` reaches, into `io_features`, the last move
// read as the one that produced it. Returns 1, or 0 on the same bad input as the search.
ENGINE_EXPORT(engine_extract) int32_t engine_extract(void);

// Leaf positions `depth` plies below the game's position, or -1 on bad input.
ENGINE_EXPORT(engine_perft) double engine_perft(uint32_t depth);

#endif
