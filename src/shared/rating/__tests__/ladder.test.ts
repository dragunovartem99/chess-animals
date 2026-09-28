import { describe, expect, it } from "vitest";

import { smoothLadder } from "../ladder";

const rung = (id: string, rating: number, stderr = 30) => ({ id, rating, stderr });

describe("smoothLadder", () => {
	it("irons noise out of an evenly spaced ladder, inversions included", () => {
		const players = [rung("a", 1000), rung("b", 1080), rung("c", 1050), rung("d", 1200)];
		const { ratings, outliers } = smoothLadder({ players, ladder: ["a", "b", "c", "d"] });

		const smoothed = ["a", "b", "c", "d"].map((id) => ratings[id]);
		expect(smoothed).toEqual(smoothed.toSorted((x, y) => x - y));
		expect(outliers).toEqual([]);
	});

	it("leaves an evenly spaced ladder exactly where it was", () => {
		const players = [0, 1, 2, 3, 4].map((i) => rung(`r${i}`, 1000 + 60 * i));
		const { ratings } = smoothLadder({ players, ladder: players.map((p) => p.id) });

		for (const player of players) expect(ratings[player.id]).toBeCloseTo(player.rating, 6);
	});

	it("reports a rung far off the curve", () => {
		// Sixteen rungs, as a roster has: with a handful, one wild rung drags its neighbours too.
		const players = Array.from({ length: 16 }, (_, i) => rung(`r${i}`, 1000 + 60 * i, 20));
		players[7] = rung("r7", 1570, 20);
		const { outliers } = smoothLadder({ players, ladder: players.map((p) => p.id) });

		expect(outliers).toEqual(["r7"]);
	});

	it("places a rung by its ladder index, skipping one the arena never rated", () => {
		const players = [rung("a", 1000), rung("c", 1200), rung("d", 1300)];
		const { ratings } = smoothLadder({ players, ladder: ["a", "b", "c", "d"] });

		expect(Object.keys(ratings)).toEqual(["a", "c", "d"]);
		expect(ratings.c).toBeCloseTo(1200, 6);
	});

	it("leaves a ladder too short to fit as measured", () => {
		expect(smoothLadder({ players: [rung("a", 1000)], ladder: ["a", "b"] })).toEqual({
			ratings: { a: 1000 },
			outliers: [],
		});
	});
});
