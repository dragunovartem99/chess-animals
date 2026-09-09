import { describe, expect, it } from "vitest";

import {
	decisivenessOf,
	nextPairings,
	type PairOutcome,
	ratingsSettled,
	runAdaptiveRating,
	type Standing,
	standingOrder,
} from "..";
import type { Matchup } from "../../rating";
import { ELO_PER_LOG, sigmoid } from "../../rating";

// 12 bots, evenly spaced 90 Elo apart.
const TRUE_ELO = Object.fromEntries(
	Array.from({ length: 12 }, (_, i) => [`bot${i}`, 1000 + i * 90])
);
const IDS = Object.keys(TRUE_ELO);
const WHITE_ADVANTAGE = 25;
const D = Math.log(1.6);

// Deterministic expected counts from the rating model — no sampling, so a pair played twice just
// doubles its weight and the standard errors fall smoothly with the game total.
function oracle(gamesPerColor: number) {
	const counts = (white: string, black: string) => {
		const delta = (TRUE_ELO[white] - TRUE_ELO[black] + WHITE_ADVANTAGE) / ELO_PER_LOG;
		const pWhite = sigmoid(delta - D);
		const pBlack = sigmoid(-delta - D);
		return {
			whiteWins: gamesPerColor * pWhite,
			blackWins: gamesPerColor * pBlack,
			draws: gamesPerColor * (1 - pWhite - pBlack),
		};
	};
	return (a: string, b: string): Promise<PairOutcome> =>
		Promise.resolve({ aWhite: counts(a, b), bWhite: counts(b, a) });
}

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

describe("runAdaptiveRating", () => {
	it("throws below two bots", async () => {
		await expect(runAdaptiveRating({ ids: ["only"], playPair: oracle(1) })).rejects.toThrow(
			/at least two/u
		);
	});

	it("ranks 12 bots in the right order, adaptively", async () => {
		const result = await runAdaptiveRating({
			ids: IDS,
			playPair: oracle(2),
			// A high stable-order threshold forces the rung-separation path, not the shortcut.
			stableRounds: 99,
		});

		const order = standingOrder(result.rating.players);
		expect(order).toEqual(IDS.toReversed());

		// Far cheaper than the paper's 19 round robins: a sparse seeding round plus a handful of
		// refinement rounds, no full round robin anywhere.
		const fullRoundRobinGames = 66 * 4 * 19;
		expect(result.games).toBeLessThan(fullRoundRobinGames / 3);
		expect(result.rounds).toBeGreaterThan(1);
	});

	it("stops early when the order is stable", async () => {
		const rounds: number[] = [];
		const result = await runAdaptiveRating({
			ids: IDS.slice(0, 6),
			playPair: oracle(4),
			stableRounds: 3,
			onRound: ({ round }) => rounds.push(round),
		});
		expect(result.rounds).toBeLessThanOrEqual(4);
		expect(rounds).toEqual(Array.from({ length: result.rounds }, (_, i) => i));
	});
});
