import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../chess";
import { extractFeatures } from "../extract";
import { featureId } from "../features";

function read({ fen, key }: { fen: string; key: string }): number {
	return extractFeatures({ position: positionFromFen(fen) })[featureId(key)];
}

describe("king safety in the opening position", () => {
	it("is level", () => {
		expect(read({ fen: INITIAL_FEN, key: "kingAttackers" })).toBe(0);
	});
});

describe("kingAttackers", () => {
	it("weights a queen near the king far above a knight", () => {
		const queen = read({ fen: "6k1/8/8/8/8/5q2/8/6K1 b - - 0 1", key: "kingAttackers" });
		const knight = read({ fen: "6k1/8/8/8/8/4n3/8/6K1 b - - 0 1", key: "kingAttackers" });

		expect(queen).toBeLessThan(knight);
		expect(queen).toBe(-5);
		expect(knight).toBe(-2);
	});

	it("counts our own king's attackers, which a negative weight then punishes", () => {
		expect(read({ fen: "6k1/8/8/8/8/5q2/8/6K1 w - - 0 1", key: "kingAttackers" })).toBe(5);
	});

	it("ignores a piece that reaches nowhere near the king", () => {
		expect(read({ fen: "6k1/8/8/8/8/8/8/n5K1 b - - 0 1", key: "kingAttackers" })).toBe(0);
	});
});
