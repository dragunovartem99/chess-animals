import { describe, expect, it } from "vitest";

import { decisivenessOf, nextPairings, orderSettled } from "..";
import type { Standing } from "..";
import type { Matchup } from "../../rating";

describe("nextPairings", () => {
	const standings: Standing[] = [
		{ id: "x", rating: 1500, stderr: 60 },
		{ id: "y", rating: 1510, stderr: 60 },
		{ id: "z", rating: 1900, stderr: 8 },
	];

	it("prefers the uncertain, evenly-matched pair", () => {
		const [top] = nextPairings({ standings, playCounts: new Map(), batchSize: 1 });
		expect(new Set([top.a, top.b])).toEqual(new Set(["x", "y"]));
	});

	it("deprioritises a pair already played a lot", () => {
		const [top] = nextPairings({
			standings,
			playCounts: new Map([["x::y", 40]]),
			batchSize: 1,
		});
		expect(new Set([top.a, top.b])).not.toEqual(new Set(["x", "y"]));
	});

	it("drops a pair the stronger side has all but settled", () => {
		const pairs = nextPairings({
			standings,
			playCounts: new Map(),
			batchSize: 9,
			decisiveness: new Map([["x::y", 0.96]]),
		});
		expect(pairs.map((p) => [p.a, p.b].toSorted().join())).not.toContain("x,y");
	});
});

describe("decisivenessOf", () => {
	it("is the stronger side's win share, both colors summed", () => {
		const matchups: Matchup[] = [
			{ white: "a", black: "b", whiteWins: 8, blackWins: 1, draws: 1 },
			{ white: "b", black: "a", whiteWins: 1, blackWins: 9, draws: 0 },
		];
		// a won 8 + 9 = 17 of 20.
		expect(decisivenessOf(matchups).get("a::b")).toBeCloseTo(0.85);
	});
});

describe("orderSettled", () => {
	it("is true when the order has held for the required rounds", () => {
		expect(
			orderSettled({
				orderHistory: [
					["a", "b"],
					["a", "b"],
				],
				stableRounds: 2,
			})
		).toBe(true);
	});

	it("is false while the order still moves, or has not run long enough", () => {
		expect(
			orderSettled({
				orderHistory: [
					["a", "b"],
					["b", "a"],
				],
				stableRounds: 2,
			})
		).toBe(false);
		expect(orderSettled({ orderHistory: [["a", "b"]], stableRounds: 2 })).toBe(false);
	});
});
