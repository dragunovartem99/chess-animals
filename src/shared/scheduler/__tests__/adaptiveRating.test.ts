import { describe, expect, it } from "vitest";

import { decisivenessOf, nextPairings, ratingsSettled, standingOrder } from "..";
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
		expect(
			pairs.some((p) => new Set([p.a, p.b]).has("x") && new Set([p.a, p.b]).has("y"))
		).toBe(false);
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

describe("ratingsSettled", () => {
	const zed = { separationZ: 1.5, tieZ: 0.5 };
	const tight: Standing[] = [
		{ id: "a", rating: 1600, stderr: 20 },
		{ id: "b", rating: 1400, stderr: 20 },
	];

	// A rung in the productive band: 100 Elo against ±99 SEs — wide enough to matter, close
	// enough that more games would still move it.
	const blurred: Standing[] = [
		{ id: "a", rating: 1650, stderr: 99 },
		{ id: "b", rating: 1550, stderr: 99 },
	];

	it("is true once every adjacent rung is separated", () => {
		expect(
			ratingsSettled({ standings: tight, ...zed, orderHistory: [], stableRounds: 3 })
		).toBe(true);
	});

	it("is true once a rung is too close to be worth chasing", () => {
		const tied: Standing[] = [
			{ id: "a", rating: 1602, stderr: 99 },
			{ id: "b", rating: 1600, stderr: 99 },
		];
		expect(ratingsSettled({ standings: tied, ...zed, orderHistory: [], stableRounds: 3 })).toBe(
			true
		);
	});

	it("is true when the order has held for the required rounds", () => {
		const order = standingOrder(blurred);
		expect(
			ratingsSettled({
				standings: blurred,
				...zed,
				orderHistory: [order, order, order],
				stableRounds: 3,
			})
		).toBe(true);
	});

	it("is false while a rung is unresolved and the order still moves", () => {
		expect(
			ratingsSettled({
				standings: blurred,
				...zed,
				orderHistory: [
					["a", "b"],
					["b", "a"],
				],
				stableRounds: 3,
			})
		).toBe(false);
	});
});
