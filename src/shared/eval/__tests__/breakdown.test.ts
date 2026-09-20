import type { Chess } from "chessops/chess";
import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../chess";
import { explain } from "../../test-support/explain";
import { extract } from "../../test-support/wasm";
import { onlyWeights } from "../../test-support/weights";
import type { WeightVector } from "../vector";

// What the engine scores the position at from the side to move: its features times the weights,
// the dot `evaluate_features` takes.
function engineScore({ position, weights }: { position: Chess; weights: WeightVector }) {
	const features = extract({ position });
	return weights.reduce((total, weight, slot) => total + features[slot] * weight, 0);
}

const MATERIAL = onlyWeights({ materialQueen: 900, materialRook: 500, materialPawn: 100 });

describe("explainPosition", () => {
	it("sums to what the search would score the position at, for White", () => {
		for (const fen of [
			INITIAL_FEN,
			"4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1",
			"8/5pk1/6p1/8/8/6P1/5PK1/8 w - - 0 40",
		]) {
			const position = positionFromFen(fen);

			expect(explain({ position, weights: MATERIAL }).total).toBeCloseTo(
				engineScore({ position, weights: MATERIAL }),
				3
			);
		}
	});

	it("leaves out features the bot has switched off", () => {
		const rows = explain({
			position: positionFromFen(INITIAL_FEN),
			weights: MATERIAL,
		}).rows;

		expect(rows.map((row) => row.key).toSorted()).toEqual([
			"materialPawn",
			"materialQueen",
			"materialRook",
		]);
	});

	it("puts the term that matters most first", () => {
		const position = positionFromFen("4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1");
		const [first] = explain({ position, weights: MATERIAL }).rows;

		expect(first.key).toBe("materialQueen");
		expect(first.points).toBe(-900);
	});
});

describe("the sign convention", () => {
	// The one thing the panel must never do is report the same position differently depending on
	// whose turn it happens to be.
	const board = "4k3/8/8/3q4/8/8/8/3RK3";

	it("reads the same for a position whoever is to move", () => {
		const white = explain({
			position: positionFromFen(`${board} w - - 0 1`),
			weights: MATERIAL,
		});
		const black = explain({
			position: positionFromFen(`${board} b - - 0 1`),
			weights: MATERIAL,
		});

		expect(black.total).toBeCloseTo(white.total, 3);
	});

	it("is negative when Black is the one who is better", () => {
		// Black is a queen up for a rook.
		expect(
			explain({ position: positionFromFen(`${board} w - - 0 1`), weights: MATERIAL }).total
		).toBeLessThan(0);
	});

	it("is positive when White is better", () => {
		const position = positionFromFen("3qk3/8/8/8/8/8/8/3RK3 b - - 0 1");

		expect(explain({ position, weights: onlyWeights({ materialRook: 500 }) }).total).toBe(500);
	});

	it("flips the feature readings too, so value times weight still gives points", () => {
		const position = positionFromFen(`${board} b - - 0 1`);
		const [row] = explain({ position, weights: MATERIAL }).rows;

		expect(row.value * row.weight).toBeCloseTo(row.points, 3);
	});
});
