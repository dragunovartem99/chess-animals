import { describe, expect, it } from "vitest";

import { invert, solve } from "../linalg";

describe("invert", () => {
	it("inverts a matrix that needs a row swap for its pivot", () => {
		const inverse = invert([
			[0, 1],
			[1, 0],
		]);
		expect(inverse).toEqual([
			[0, 1],
			[1, 0],
		]);
	});

	it("round-trips a symmetric matrix to the identity", () => {
		const matrix = [
			[4, 1, 2],
			[1, 3, 0],
			[2, 0, 5],
		];
		const inverse = invert(matrix);
		const product = matrix.map((row) =>
			row.map((_, j) => row.reduce((sum, value, k) => sum + value * inverse[k][j], 0))
		);
		const identity = [1, 0, 0, 0, 1, 0, 0, 0, 1];
		for (const [k, value] of product.flat().entries())
			expect(value).toBeCloseTo(identity[k], 10);
	});

	it("throws on a singular matrix", () => {
		expect(() =>
			invert([
				[1, 2],
				[2, 4],
			])
		).toThrow(/singular/u);
	});
});

describe("solve", () => {
	it("solves a linear system", () => {
		expect(
			solve(
				[
					[2, 0],
					[0, 4],
				],
				[6, 8]
			)
		).toEqual([3, 2]);
	});
});
