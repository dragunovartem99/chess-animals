import { describe, expect, it } from "vitest";

import { field, interleave, seedPairs } from "..";
import type { TournamentBot } from "..";

const land = (id: string): TournamentBot => ({
	id,
	definition: { id, search: { depth: 1 }, weights: {} },
});
const fish = (id: string): TournamentBot => ({
	id,
	definition: { id, search: { depth: 1 }, weights: {}, maia: { elo: 1500 } },
});

describe("interleave", () => {
	it("deals the sparse items evenly, keeping each list's order", () => {
		expect(interleave({ sparse: ["x", "y"], dense: ["1", "2", "3", "4"] })).toEqual([
			"1",
			"2",
			"x",
			"3",
			"4",
			"y",
		]);
		expect(interleave({ sparse: ["x"], dense: [] })).toEqual(["x"]);
		expect(interleave({ sparse: [], dense: ["1", "2"] })).toEqual(["1", "2"]);
	});
});

describe("field", () => {
	const bots = [
		...Array.from({ length: 34 }, (_, i) => land(`land${i}`)),
		...Array.from({ length: 16 }, (_, i) => fish(`fish${i}`)),
	];
	const { ids, playable } = field(bots);

	it("keeps every bot once", () => {
		expect(ids.toSorted()).toEqual(bots.map((bot) => bot.id).toSorted());
	});

	it("refuses only a pair of maia animals", () => {
		expect(playable("fish0", "fish1")).toBe(false);
		expect(playable("fish0", "land1")).toBe(true);
		expect(playable("land0", "land1")).toBe(true);
	});

	it("spreads the maia animals so the seed ring loses no pair to the filter", () => {
		const open = seedPairs({ ids, degree: 4 });
		const filtered = seedPairs({ ids, degree: 4, playable });
		expect(filtered).toEqual(open);
		const kinds = filtered.map(({ a, b }) => `${a.slice(0, 4)}-${b.slice(0, 4)}`);
		expect(kinds).not.toContain("fish-fish");
	});
});
