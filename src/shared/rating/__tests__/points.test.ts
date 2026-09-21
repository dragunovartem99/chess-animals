import { describe, expect, it } from "vitest";

import { toPoints } from "../points";

describe("toPoints", () => {
	it("shifts the scale until the anchors sit where they were asked to, on average", () => {
		const ratings = { shrimp: 100, whale: 900, wolf: 500 };
		const anchors = { shrimp: 600, whale: 1600 };

		// The anchors are 500 and 700 below their Elo: the scale moves up by the mean, 600.
		expect(toPoints({ ratings, anchors })).toEqual({ shrimp: 700, whale: 1500, wolf: 1100 });
	});

	it("keeps the gaps the arena measured", () => {
		const points = toPoints({ ratings: { a: -40, b: 260 }, anchors: { a: 1000 } });

		expect(points).toEqual({ a: 1000, b: 1300 });
	});

	it("rounds to tens, and goes below zero for a bot worse than any person", () => {
		const points = toPoints({ ratings: { a: 0, b: 12, dove: -900 }, anchors: { a: 500 } });

		expect(points).toEqual({ a: 500, b: 510, dove: -400 });
	});

	it("ignores an anchor the arena did not rate, and refuses when none was", () => {
		expect(toPoints({ ratings: { a: 0 }, anchors: { a: 500, gone: 9000 } })).toEqual({
			a: 500,
		});
		expect(() => toPoints({ ratings: { a: 0 }, anchors: { gone: 500 } })).toThrow("no anchor");
	});
});
