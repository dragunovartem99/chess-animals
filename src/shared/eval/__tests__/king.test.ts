import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../chess";
import { extractFeatures } from "../extract";
import { featureId } from "../features";

function read({ fen, key }: { fen: string; key: string }): number {
	return extractFeatures({ position: positionFromFen(fen) })[featureId(key)];
}

describe("king safety in the opening position", () => {
	it("is level on every trait", () => {
		for (const key of ["kingAttackers", "kingPawnDistance"]) {
			expect(read({ fen: INITIAL_FEN, key })).toBe(0);
		}
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

describe("kingPawnDistance", () => {
	it("measures to the nearest own pawn in king moves", () => {
		expect(read({ fen: "7k/8/8/8/8/8/P7/7K w - - 0 1", key: "kingPawnDistance" })).toBe(7);
	});

	it("is zero for a king already beside his pawns", () => {
		expect(read({ fen: "7k/8/8/8/8/8/6P1/7K w - - 0 1", key: "kingPawnDistance" })).toBe(1);
	});

	it("reads zero when a side has no pawns at all", () => {
		expect(read({ fen: "7k/8/8/8/8/8/8/7K w - - 0 1", key: "kingPawnDistance" })).toBe(0);
	});
});
