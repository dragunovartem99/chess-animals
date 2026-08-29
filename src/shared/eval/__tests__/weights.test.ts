import { describe, expect, it } from "vitest";

import { interpolateWeights } from "../weights";

const weights = {
	opening: Float32Array.from([0, 10]),
	middlegame: Float32Array.from([100, 20]),
	endgame: Float32Array.from([200, 30]),
};

describe("interpolateWeights", () => {
	it("returns the opening set at full material", () => {
		expect([...interpolateWeights({ weights, phase: 0 })]).toEqual([0, 10]);
	});

	it("returns the middlegame set at the midpoint", () => {
		expect([...interpolateWeights({ weights, phase: 0.5 })]).toEqual([100, 20]);
	});

	it("returns the endgame set at bare kings", () => {
		expect([...interpolateWeights({ weights, phase: 1 })]).toEqual([200, 30]);
	});

	it("blends linearly between opening and middlegame", () => {
		expect([...interpolateWeights({ weights, phase: 0.25 })]).toEqual([50, 15]);
	});

	it("blends linearly between middlegame and endgame", () => {
		expect([...interpolateWeights({ weights, phase: 0.75 })]).toEqual([150, 25]);
	});

	it("is continuous across the midpoint, so no capture can step the evaluation", () => {
		const before = interpolateWeights({ weights, phase: 0.499 })[0];
		const after = interpolateWeights({ weights, phase: 0.501 })[0];

		expect(Math.abs(after - before)).toBeLessThan(1);
	});

	it("clamps a phase outside [0, 1] rather than extrapolating", () => {
		expect([...interpolateWeights({ weights, phase: -5 })]).toEqual([0, 10]);
		expect([...interpolateWeights({ weights, phase: 5 })]).toEqual([200, 30]);
	});
});
