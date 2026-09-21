import { describe, expect, it } from "vitest";

import { fitBradleyTerry } from "..";
import type { Matchup } from "..";
import { TRUE_ELO, synthesise } from "../../test-support/synthesise";

// A pair with the wolf in it is sampled a few hundred times more thinly than any other.
const wolfRarelyPlays = (a: string, b: string) => (a === "wolf" || b === "wolf" ? 20 : 5000);

describe("fitBradleyTerry", () => {
	it("recovers known ratings from a synthetic matrix", () => {
		const result = fitBradleyTerry({
			matchups: synthesise({
				trueElo: TRUE_ELO,
				white: 35,
				draw: 1.9,
				games: () => 4000,
			}),
		});

		for (const { id, rating } of result.players) {
			expect(Math.abs(rating - TRUE_ELO[id as keyof typeof TRUE_ELO])).toBeLessThan(2);
		}
		expect(result.whiteAdvantage).toBeCloseTo(35, 0);
		expect(result.drawParam).toBeCloseTo(1.9, 2);
		expect(result.converged).toBe(true);
	});

	it("is order-independent", () => {
		const matchups = synthesise({
			trueElo: TRUE_ELO,
			white: 20,
			draw: 1.5,
			games: () => 500,
		});
		const forward = fitBradleyTerry({ matchups });
		const shuffled = fitBradleyTerry({ matchups: matchups.toReversed() });

		for (let i = 0; i < forward.players.length; i += 1) {
			const mine = forward.players[i];
			const theirs = shuffled.players.find((p) => p.id === mine.id)!;
			expect(theirs.rating).toBeCloseTo(mine.rating, 4);
		}
	});
});

describe("fitBradleyTerry on lopsided or thin data", () => {
	it("stays stable when pair counts are wildly imbalanced", () => {
		const result = fitBradleyTerry({
			matchups: synthesise({
				trueElo: TRUE_ELO,
				white: 30,
				draw: 1.7,
				games: wolfRarelyPlays,
			}),
		});

		const order = result.players.toSorted((a, b) => b.rating - a.rating).map((p) => p.id);
		expect(order).toEqual(["wolf", "fox", "cat", "donkey", "rock"]);
		expect(result.players.every((p) => Number.isFinite(p.rating))).toBe(true);
		expect(result.players.every((p) => p.stderr > 0)).toBe(true);
	});

	it("keeps an undefeated player finite", () => {
		const matchups: Matchup[] = [
			{ white: "hero", black: "a", whiteWins: 50, blackWins: 0, draws: 0 },
			{ white: "a", black: "hero", whiteWins: 0, blackWins: 50, draws: 0 },
			{ white: "a", black: "b", whiteWins: 20, blackWins: 20, draws: 10 },
			{ white: "b", black: "a", whiteWins: 20, blackWins: 20, draws: 10 },
		];
		const result = fitBradleyTerry({ matchups });
		const hero = result.players.find((p) => p.id === "hero")!;

		expect(Number.isFinite(hero.rating)).toBe(true);
		expect(hero.rating).toBeGreaterThan(result.players.find((p) => p.id === "a")!.rating);
	});

	it("reports tighter standard errors from more games", () => {
		const few = fitBradleyTerry({
			matchups: synthesise({ trueElo: TRUE_ELO, white: 20, draw: 1.6, games: () => 100 }),
		});
		const many = fitBradleyTerry({
			matchups: synthesise({ trueElo: TRUE_ELO, white: 20, draw: 1.6, games: () => 10000 }),
		});

		const fewStderr = few.players.find((p) => p.id === "cat")!.stderr;
		const manyStderr = many.players.find((p) => p.id === "cat")!.stderr;
		expect(manyStderr).toBeLessThan(fewStderr);
	});

	it("throws on an empty matrix", () => {
		expect(() => fitBradleyTerry({ matchups: [] })).toThrow(/no matchups/u);
	});
});
