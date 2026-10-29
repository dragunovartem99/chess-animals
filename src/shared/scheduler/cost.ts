import type { BotDefinition } from "../bots";
import type { GameSpec } from "./types";

// What one game costs in wall time, measured: a land game ~50 ms at any depth, a Stockfish one
// ~0.8 s, a Maia one 3–15 s (a transformer run per move, every worker's copy sharing one laptop's
// power budget). Sizes the opening window a pair-visit plays, and orders the pool's queue.
export const botCost = (bot: BotDefinition): number => (bot.maia ? 4 : bot.stockfish ? 2 : 1);

export const gameCost = (spec: GameSpec): number =>
	Math.max(botCost(spec.white), botCost(spec.black));

// Longest-processing-time first: a round waits for its last game, so the slow Maia ones start
// first and the cheap land games fill the tail instead of fifteen idle workers watching one game.
export function takeCostliest<Job extends { spec: GameSpec }>(queue: Job[]): Job | undefined {
	if (queue.length === 0) return;
	let best = 0;
	queue.forEach((job, i) => {
		if (gameCost(job.spec) > gameCost(queue[best].spec)) best = i;
	});
	return queue.splice(best, 1)[0];
}
