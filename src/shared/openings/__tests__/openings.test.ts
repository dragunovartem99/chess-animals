import { describe, expect, it } from "vitest";

import { openingSchedule, openings, probe, validateOpenings } from "..";

describe("the opening set", () => {
	it("loads ~50 openings with unique ids and legal FENs", () => {
		expect(openings.length).toBeGreaterThanOrEqual(48);
		expect(() => validateOpenings()).not.toThrow();
	});

	it("rejects a set with a duplicate id", () => {
		const dupe = [openings[0], openings[0]];
		expect(() => validateOpenings(dupe)).toThrow(/duplicate opening id/u);
	});
});

describe("probe", () => {
	it("finds an opening from its own FEN", () => {
		expect(probe(openings[3].fen)?.id).toBe(openings[3].id);
	});

	it("ignores the move counters", () => {
		const [board, turn, castling, ep] = openings[0].fen.split(" ");
		expect(probe(`${board} ${turn} ${castling} ${ep} 9 40`)?.id).toBe(openings[0].id);
	});

	it("returns undefined for a position not in the set", () => {
		expect(probe("8/8/8/8/8/8/8/K6k w - - 0 1")).toBeUndefined();
	});
});

describe("openingSchedule", () => {
	it("plays every opening once each color", () => {
		const schedule = openingSchedule();
		expect(schedule).toHaveLength(openings.length * 2);

		for (const opening of openings) {
			const games = schedule.filter((game) => game.openingId === opening.id);
			expect(games.map((game) => game.swapColors).toSorted()).toEqual([false, true]);
			expect(games.every((game) => game.fen === opening.fen)).toBe(true);
		}
	});
});
