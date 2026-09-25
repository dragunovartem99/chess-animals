import { describe, expect, it } from "vitest";

import { openings, validateOpenings } from "..";

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
