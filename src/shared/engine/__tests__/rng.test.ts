import { describe, expect, it } from "vitest";

import { createRng } from "../rng";

function take({ seed, count }: { seed: number | string; count: number }): number[] {
	const rng = createRng(seed);
	return Array.from({ length: count }, () => rng.float());
}

describe("createRng", () => {
	it("replays the same sequence from the same seed", () => {
		expect(take({ seed: 42, count: 8 })).toEqual(take({ seed: 42, count: 8 }));
	});

	it("gives different sequences to different seeds", () => {
		expect(take({ seed: 42, count: 8 })).not.toEqual(take({ seed: 43, count: 8 }));
	});

	it("accepts a string seed", () => {
		expect(take({ seed: "swarm-wolf", count: 4 })).toEqual(
			take({ seed: "swarm-wolf", count: 4 })
		);
		expect(take({ seed: "swarm-wolf", count: 4 })).not.toEqual(
			take({ seed: "huddle-turtle", count: 4 })
		);
	});

	it("does not collapse when seeded with zero", () => {
		const values = take({ seed: 0, count: 8 });

		expect(new Set(values).size).toBeGreaterThan(1);
	});

	it("stays inside [0, 1)", () => {
		const values = take({ seed: 7, count: 2000 });

		expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
		expect(Math.max(...values)).toBeLessThan(1);
	});

	it("spreads roughly evenly across its range", () => {
		const rng = createRng("uniformity");
		const buckets = Array.from({ length: 10 }, () => 0);

		for (let index = 0; index < 20000; index += 1) buckets[rng.int(10)] += 1;

		// 2000 expected per bucket; a working generator lands well inside ±15%.
		expect(Math.min(...buckets)).toBeGreaterThan(1700);
		expect(Math.max(...buckets)).toBeLessThan(2300);
	});
});

describe("int", () => {
	it("stays below the bound", () => {
		const rng = createRng(1);
		const values = Array.from({ length: 500 }, () => rng.int(3));

		expect(Math.min(...values)).toBe(0);
		expect(Math.max(...values)).toBe(2);
	});
});

describe("pick", () => {
	it("only ever returns an element of the array", () => {
		const rng = createRng(2);
		const items = ["a", "b", "c"] as const;

		expect(
			Array.from({ length: 50 }, () => rng.pick(items)).every((item) => items.includes(item))
		).toBe(true);
	});

	it("throws rather than returning undefined for an empty array", () => {
		expect(() => createRng(3).pick([])).toThrow("cannot pick from an empty array");
	});
});
