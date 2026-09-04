import { mkdtempSync } from "node:fs";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createGameCache, gameKey, runGamesCached } from "..";
import type { GameReport, GameSpec } from "..";
import type { BotDefinition } from "../../bots";

const bot = (id: string, weight: number): BotDefinition => ({
	id,
	search: { depth: 1 },
	temperature: 0,
	weights: { materialPawn: weight },
});

const spec = (over: Partial<GameSpec> = {}): GameSpec => ({
	white: bot("a", 20),
	black: bot("b", 20),
	openingFen: "startpos",
	openingId: "ruy-lopez",
	seed: 1,
	plyLimit: 40,
	...over,
});

const dirs: string[] = [];
function scratchDir(): string {
	const dir = mkdtempSync(join(tmpdir(), "cache-"));
	dirs.push(dir);
	return dir;
}
afterEach(() => {
	for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("gameKey", () => {
	it("is stable across property order and independent runs", () => {
		expect(gameKey(spec())).toBe(gameKey(spec()));
	});

	it("changes when a bot's weights change", () => {
		expect(gameKey(spec({ white: bot("a", 21) }))).not.toBe(gameKey(spec()));
	});

	it("changes when the colours are swapped", () => {
		expect(gameKey(spec({ white: bot("b", 20), black: bot("a", 20) }))).not.toBe(
			gameKey(spec())
		);
	});

	it("keys on the opening id, not the FEN, when one is given", () => {
		expect(gameKey(spec({ openingFen: "other" }))).toBe(gameKey(spec()));
		expect(gameKey(spec({ openingId: undefined }))).not.toBe(gameKey(spec()));
	});
});

describe("createGameCache", () => {
	it("round-trips a report through disk", () => {
		const cache = createGameCache({ dir: scratchDir() });
		const stored: GameReport = { result: "white", reason: "checkmate", plies: 30 };

		expect(cache.get(spec())).toBeUndefined();
		cache.set(spec(), stored);
		expect(cache.get(spec())).toEqual(stored);
	});
});

const report = (plies: number): GameReport => ({ result: null, reason: "ply-limit", plies });

describe("runGamesCached", () => {
	it("replays only the games a newly added bot is in", async () => {
		const cache = createGameCache({ dir: scratchDir() });

		const first: GameSpec[] = [spec({ seed: 1 }), spec({ seed: 2 })];
		const firstRun = await runGamesCached({
			specs: first,
			cache,
			run: (misses) => Promise.resolve(misses.map((_, i) => report(i))),
		});
		expect(firstRun.fromCache).toBe(0);

		// Re-run with the same two games plus two involving a fresh bot `c`.
		const ran: GameSpec[] = [];
		const second: GameSpec[] = [
			spec({ seed: 1 }),
			spec({ seed: 2 }),
			spec({ seed: 1, black: bot("c", 30) }),
			spec({ seed: 2, black: bot("c", 30) }),
		];
		const secondRun = await runGamesCached({
			specs: second,
			cache,
			run: (misses) => {
				ran.push(...misses);
				return Promise.resolve(misses.map(() => report(99)));
			},
		});

		expect(ran).toHaveLength(2);
		expect(ran.every((s) => s.black.id === "c")).toBe(true);
		expect(secondRun.fromCache).toBe(2);
		expect(secondRun.reports).toHaveLength(4);
		expect(secondRun.reports.slice(0, 2)).toEqual(firstRun.reports);
	});
});
