import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { positionFromFen } from "@/shared/chess";
import { evaluatePosition } from "@/shared/engine";
import { onlyWeights } from "@/shared/test-support/weights";

import { explainPosition } from "../utils/breakdown";

const MATERIAL = onlyWeights({ materialQueen: 900, materialRook: 500, materialPawn: 100 });

describe("explainPosition", () => {
	it("sums to exactly what the search would score the position at", () => {
		for (const fen of [
			INITIAL_FEN,
			"4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1",
			"8/5pk1/6p1/8/8/6P1/5PK1/8 w - - 0 40",
		]) {
			const position = positionFromFen(fen);

			expect(explainPosition({ position, weights: MATERIAL }).total).toBeCloseTo(
				evaluatePosition({ position, weights: MATERIAL }),
				3
			);
		}
	});

	it("leaves out features the bot has switched off", () => {
		const rows = explainPosition({
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
		const [first] = explainPosition({ position, weights: MATERIAL }).rows;

		expect(first.key).toBe("materialQueen");
		expect(first.points).toBe(-900);
	});

	it("shows the weight after the phase blend, not the one that was authored", () => {
		const weights = {
			opening: onlyWeights({ materialPawn: 100 }).opening,
			middlegame: onlyWeights({ materialPawn: 100 }).middlegame,
			endgame: onlyWeights({ materialPawn: 200 }).endgame,
		};
		const endgame = positionFromFen("4k3/pppppppp/8/8/8/8/PPPPPPPP/4K3 w - - 0 1");
		const [row] = explainPosition({ position: endgame, weights }).rows;

		expect(explainPosition({ position: endgame, weights }).phase).toBe(1);
		expect(row.weight).toBe(200);
	});
});
