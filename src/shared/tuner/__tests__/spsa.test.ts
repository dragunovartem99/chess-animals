import { describe, expect, it } from "vitest";

import { rademacher, runSpsa, spsaGains } from "..";
import { createRng } from "../../engine";

describe("spsaGains", () => {
	it("returns a and c at the first step and decays from there", () => {
		const first = spsaGains({ a: 1, c: 1 }, 0);
		expect(first).toEqual({ ak: 1, ck: 1 });

		const later = spsaGains({ a: 1, c: 1 }, 50);
		expect(later.ak).toBeLessThan(first.ak);
		expect(later.ck).toBeLessThan(first.ck);
		// c decays slower than a, so it stays the larger of the two.
		expect(later.ck).toBeGreaterThan(later.ak);
	});

	it("damps the early steps with A", () => {
		expect(spsaGains({ a: 1, c: 1, A: 100 }, 0).ak).toBeLessThan(
			spsaGains({ a: 1, c: 1 }, 0).ak
		);
	});
});

describe("rademacher", () => {
	it("draws ±1, balanced, and reproduces from a seed", () => {
		const values = rademacher({ size: 400, rng: createRng(99) });

		expect(values.every((v) => v === 1 || v === -1)).toBe(true);
		expect(Math.abs(values.reduce((sum, v) => sum + v, 0))).toBeLessThan(80);
		expect(rademacher({ size: 400, rng: createRng(99) })).toEqual(values);
	});
});

describe("runSpsa", () => {
	// A deliberately detuned start: five weights, all at zero, whose ideal values are known. The
	// score is how close the vector is (negative squared distance), standing in for a gauntlet.
	const TARGET = [10, -5, 3, 0, 7];
	const loss = (theta: number[]) =>
		-theta.reduce((sum, value, i) => sum + (value - TARGET[i]) ** 2, 0);

	it("measurably improves the detuned vector", async () => {
		const start = [0, 0, 0, 0, 0];
		const result = await runSpsa({
			theta: start,
			iterations: 250,
			config: { a: 0.25, c: 0.5, A: 20 },
			rng: createRng(1),
			evaluate: (candidate) => Promise.resolve(loss(candidate)),
		});

		const distance = (theta: number[]) => Math.sqrt(-loss(theta));
		expect(distance(result.theta)).toBeLessThan(distance(start) / 4);
		expect(result.best.score).toBeGreaterThan(loss(start));
		expect(result.scores.at(-1)!).toBeGreaterThan(result.scores[0]);
	});

	it("honours the clamp on every point it evaluates", async () => {
		const seen: number[][] = [];
		await runSpsa({
			theta: [0, 0],
			iterations: 20,
			config: { a: 0.5, c: 1 },
			rng: createRng(2),
			clamp: (candidate) => candidate.map((value) => Math.max(-1, Math.min(1, value))),
			evaluate: (candidate) => {
				seen.push(candidate);
				return Promise.resolve(-(candidate[0] ** 2) - candidate[1] ** 2);
			},
		});

		expect(seen.flat().every((value) => value >= -1 && value <= 1)).toBe(true);
	});

	it("is reproducible from the rng seed", async () => {
		const run = () =>
			runSpsa({
				theta: [1, 2, 3],
				iterations: 30,
				config: { a: 0.2, c: 0.3 },
				rng: createRng(7),
				evaluate: (candidate) => Promise.resolve(loss([...candidate, 0, 0])),
			});
		expect((await run()).theta).toEqual((await run()).theta);
	});
});
