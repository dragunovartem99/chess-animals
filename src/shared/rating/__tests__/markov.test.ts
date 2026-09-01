import { describe, expect, it } from "vitest";

import { markovChampion } from "..";
import type { Matchup } from "..";

// A one-way result: `winner` took every game from `loser`.
function sweep(winner: string, loser: string, games = 100): Matchup {
	return { white: winner, black: loser, whiteWins: games, blackWins: 0, draws: 0 };
}

function even(a: string, b: string): Matchup {
	return { white: a, black: b, whiteWins: 50, blackWins: 50, draws: 0 };
}

describe("markovChampion", () => {
	it("recovers the closed-form stationary share of a two-player chain", () => {
		// A beats B four games in five. The trophy chain's stationary share of the leader is
		// exactly its win probability, so A should hold the trophy 80% of the time.
		const matchups: Matchup[] = [
			{ white: "a", black: "b", whiteWins: 80, blackWins: 20, draws: 0 },
		];
		const [top, bottom] = markovChampion({ matchups });

		expect(top.id).toBe("a");
		expect(top.share).toBeCloseTo(0.8, 6);
		expect(bottom.share).toBeCloseTo(0.2, 6);
	});

	it("gives every player an equal share when all games are coin flips", () => {
		const shares = markovChampion({
			matchups: [even("a", "b"), even("b", "c"), even("a", "c")],
		});

		for (const { share } of shares) expect(share).toBeCloseTo(1 / 3, 6);
	});

	it("hands the whole share to a bot that beats everyone", () => {
		const shares = markovChampion({
			matchups: [sweep("a", "b"), sweep("a", "c"), sweep("b", "c")],
		});

		expect(shares[0].id).toBe("a");
		expect(shares[0].share).toBeCloseTo(1, 6);
		expect(shares.map((s) => s.share).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 9);
	});

	it("throws on an empty matrix", () => {
		expect(() => markovChampion({ matchups: [] })).toThrow(/no matchups/u);
	});
});
