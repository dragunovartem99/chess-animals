#ifndef ENGINE_API_H
#define ENGINE_API_H

#include <stdint.h>

// Bumped whenever an export's signature or the linear-memory layout changes: the TS binding
// checks it at load, so a stale engine.wasm fails loudly instead of misreading memory.
#define ENGINE_ABI_VERSION 1

// Named exports rather than `--export-all`: the module's surface is exactly what is marked here.
#ifdef __wasm__
#define ENGINE_EXPORT(name) __attribute__((export_name(#name)))
#else
#define ENGINE_EXPORT(name)
#endif

ENGINE_EXPORT(abi_version) uint32_t abi_version(void);

// Builds every table the engine reads — Zobrist keys now, attack tables next. Called once, before
// anything else; the build does no allocation, so this is the only setup there is.
ENGINE_EXPORT(engine_init) void engine_init(void);

#endif
