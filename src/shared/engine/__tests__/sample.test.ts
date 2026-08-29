import { describe, expect, it } from "vitest";

import { createRng } from "../rng";
import { argmaxIndex, softmaxSample } from "../sample";

function histogram({
	scores,
	temperature,
	draws,
}: {
	scores: number[];
	temperature: number;
	draws: number;
}): number[] {
	const rng = createRng("sampling");
	const counts = scores.map(() => 0);

	for (let index = 0; index < draws; index += 1)
		counts[softmaxSample({ scores, temperature, rng })] += 1;

	return counts;
}

describe("argmaxIndex", () => {
	it("returns the single best index", () => {
		expect(argmaxIndex({ scores: [1, 9, 3], rng: createRng(1) })).toBe(1);
	});

	it("spreads ties across every tied index", () => {
		const rng = createRng("ties");
		const seen = new Set(
			Array.from({ length: 50 }, () => argmaxIndex({ scores: [5, 5, 5, 1], rng }))
		);

		expect(seen).toEqual(new Set([0, 1, 2]));
	});

	it("handles negative scores", () => {
		expect(argmaxIndex({ scores: [-9, -2, -7], rng: createRng(1) })).toBe(1);
	});

	it("throws on an empty score list", () => {
		expect(() => argmaxIndex({ scores: [], rng: createRng(1) })).toThrow("empty score list");
	});
});

describe("softmaxSample", () => {
	it("is a plain argmax at zero temperature", () => {
		const rng = createRng(1);
		const picks = Array.from({ length: 20 }, () =>
			softmaxSample({ scores: [1, 9, 3], temperature: 0, rng })
		);

		expect(new Set(picks)).toEqual(new Set([1]));
	});

	it("prefers higher scores, but does not always take them", () => {
		const counts = histogram({ scores: [0, 100], temperature: 50, draws: 4000 });

		expect(counts[1]).toBeGreaterThan(counts[0]);
		expect(counts[0]).toBeGreaterThan(0);
	});

	it("approaches a uniform choice as the temperature rises", () => {
		const counts = histogram({ scores: [0, 100], temperature: 100000, draws: 4000 });

		expect(Math.abs(counts[0] - counts[1])).toBeLessThan(300);
	});

	it("approaches the best move as the temperature falls", () => {
		const counts = histogram({ scores: [0, 100], temperature: 1, draws: 500 });

		expect(counts[0]).toBe(0);
	});

	it("survives scores large enough to overflow a bare exp", () => {
		const counts = histogram({ scores: [1e6, 1e6 + 1], temperature: 1e-3, draws: 100 });

		expect(counts[1]).toBe(100);
	});

	it("throws on an empty score list", () => {
		expect(() => softmaxSample({ scores: [], temperature: 1, rng: createRng(1) })).toThrow(
			"empty score list"
		);
	});
});
