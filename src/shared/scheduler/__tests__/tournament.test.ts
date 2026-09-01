import { describe, expect, it } from "vitest";

import { runTournament, type TournamentBot } from "..";
import type { GameReport, GameSpec } from "..";
import type { BotDefinition } from "../../bots";

const STRENGTH: Record<string, number> = { wolf: 1.4, fox: 0.7, cat: 0, donkey: -0.9 };

const bot = (id: string): TournamentBot => ({
	id,
	definition: {
		id,
		search: { depth: 1 },
		temperature: 0,
		weights: { middlegame: {} },
	} satisfies BotDefinition,
});

const BOTS = Object.keys(STRENGTH).map((id) => bot(id));
const OPENINGS = Array.from({ length: 6 }, (_, i) => ({ id: `op${i}`, fen: `fen-${i}` }));

// A seeded 0–1 draw, so replays of a pair (different seeds) get different results.
function rand(seed: number): number {
	let t = (seed >>> 0) + 0x6d2b79f5;
	t = Math.imul(t ^ (t >>> 15), t | 1);
	t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// A synthetic pool: each game's result follows the strength gap plus a white edge, with a draw
// band, decided by the spec's seed alone — so the whole tournament is a pure function of its seed.
function fakeRun(specs: GameSpec[]): Promise<GameReport[]> {
	return Promise.resolve(
		specs.map((spec) => {
			const edge = STRENGTH[spec.white.id] - STRENGTH[spec.black.id] + 0.25;
			const pWhite = 1 / (1 + Math.exp(-edge));
			const roll = rand(spec.seed);
			const result = roll < pWhite - 0.15 ? "white" : roll > pWhite + 0.15 ? "black" : null;
			return { result, reason: "checkmate", plies: 40 };
		})
	);
}

describe("runTournament", () => {
	it("produces a cross-table whose order matches the ratings", async () => {
		const result = await runTournament({
			bots: BOTS,
			openings: OPENINGS,
			seed: 1,
			run: fakeRun,
			targetStderr: 45,
		});

		const byRating = result.rating.players
			.toSorted((a, b) => b.rating - a.rating)
			.map((p) => p.id);
		expect(byRating).toEqual(["wolf", "fox", "cat", "donkey"]);
		expect(result.crossTable.rows.map((row) => row.id)).toEqual(byRating);

		const totals = result.crossTable.rows.map((row) => row.points);
		expect(totals).toEqual(totals.toSorted((a, b) => b - a));
	});

	it("is a pure function of the seed", async () => {
		const run = () => runTournament({ bots: BOTS, openings: OPENINGS, seed: 7, run: fakeRun });
		expect(await run()).toEqual(await run());
	});

	it("gives a different tournament for a different seed", async () => {
		const a = await runTournament({ bots: BOTS, openings: OPENINGS, seed: 1, run: fakeRun });
		const b = await runTournament({ bots: BOTS, openings: OPENINGS, seed: 2, run: fakeRun });
		expect(a.rating.players).not.toEqual(b.rating.players);
	});
});
