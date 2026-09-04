import { describe, expect, it } from "vitest";

import { crossTable } from "..";
import type { Matchup } from "../../rating";

const matchups: Matchup[] = [
	{ white: "a", black: "b", whiteWins: 6, blackWins: 2, draws: 2 },
	{ white: "b", black: "a", whiteWins: 3, blackWins: 5, draws: 2 },
	{ white: "a", black: "c", whiteWins: 8, blackWins: 1, draws: 1 },
	{ white: "c", black: "a", whiteWins: 2, blackWins: 7, draws: 1 },
];

describe("crossTable", () => {
	it("folds both colors into one score per opponent", () => {
		const table = crossTable({ ids: ["a", "b", "c"], matchups });
		const rowA = table.rows.find((row) => row.id === "a")!;

		// vs b: as white 6 wins + 1 draw = 7 of 10; as black 5 wins + 1 draw = 6 of 10 → 13 of 20.
		expect(rowA.cells[1]).toBe(13);
		// vs c: 8 + 0.5 as white, 7 + 0.5 as black → 16 of 20.
		expect(rowA.cells[2]).toBe(16);
		expect(rowA.cells[0]).toBeNull();
		expect(rowA.points).toBe(29);
		expect(rowA.games).toBe(40);
	});

	it("keeps the row order it was given", () => {
		expect(crossTable({ ids: ["c", "a", "b"], matchups }).rows.map((r) => r.id)).toEqual([
			"c",
			"a",
			"b",
		]);
	});
});
