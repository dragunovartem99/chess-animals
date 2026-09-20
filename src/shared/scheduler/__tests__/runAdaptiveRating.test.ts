import { describe, expect, it } from "vitest";

import { runAdaptiveRating, standingOrder } from "..";
import type { PairOutcome } from "..";
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
