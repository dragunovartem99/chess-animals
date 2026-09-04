import { describe, expect, it } from "vitest";

import {
	nextPairings,
	type PairOutcome,
	ratingsSettled,
	runAdaptiveRating,
	type Standing,
	standingOrder,
} from "..";
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
});

describe("ratingsSettled", () => {
	const tight: Standing[] = [
		{ id: "a", rating: 1600, stderr: 20 },
		{ id: "b", rating: 1400, stderr: 20 },
	];

	it("is true once every interval is under the target", () => {
		expect(
			ratingsSettled({
				standings: tight,
				targetStderr: 40,
				orderHistory: [],
				stableRounds: 3,
			})
		).toBe(true);
	});

	it("is true when the order has held for the required rounds", () => {
		const order = standingOrder(tight);
		expect(
			ratingsSettled({
				standings: [{ id: "a", rating: 1600, stderr: 99 }],
				targetStderr: 40,
				orderHistory: [order, order, order],
				stableRounds: 3,
			})
		).toBe(true);
	});

	it("is false while intervals are wide and the order still moves", () => {
		expect(
			ratingsSettled({
				standings: [{ id: "a", rating: 1600, stderr: 99 }],
				targetStderr: 40,
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

	it("ranks 12 bots in the right order within the CI target, adaptively", async () => {
		const result = await runAdaptiveRating({
			ids: IDS,
			playPair: oracle(2),
			targetStderr: 40,
			// A high stable-order threshold forces the CI path rather than the shortcut.
			stableRounds: 99,
		});

		const order = standingOrder(result.rating.players);
		expect(order).toEqual(IDS.toReversed());
		expect(result.rating.players.every((p) => p.stderr <= 40)).toBe(true);

		// Far cheaper than the paper's 19 round robins: one seeding round robin (66 pairs) plus a
		// handful of 12-pair refinement rounds.
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
