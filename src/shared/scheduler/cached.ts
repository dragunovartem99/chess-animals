import type { createGameCache } from "./cache";
import { runGames } from "./pool";
import type { GameReport, GameSpec } from "./types";

type GameCache = ReturnType<typeof createGameCache>;

// Runs only the games the cache has never seen and fills the rest from disk, then writes the
// fresh results back. `run` is injectable so a test can drive it without a pool; by default it is
// the worker pool.
export async function runGamesCached({
	specs,
	cache,
	run = (misses) => runGames({ specs: misses }),
}: {
	specs: readonly GameSpec[];
	cache: GameCache;
	run?: (misses: GameSpec[]) => Promise<GameReport[]>;
}): Promise<{ reports: GameReport[]; fromCache: number }> {
	const reports: GameReport[] = [];
	const missIndexes: number[] = [];

	specs.forEach((spec, index) => {
		const hit = cache.get(spec);
		if (hit) reports[index] = hit;
		else missIndexes.push(index);
	});

	const fresh = await run(missIndexes.map((index) => specs[index]));
	missIndexes.forEach((specIndex, freshIndex) => {
		reports[specIndex] = fresh[freshIndex];
		cache.set(specs[specIndex], fresh[freshIndex]);
	});

	return { reports, fromCache: specs.length - missIndexes.length };
}
