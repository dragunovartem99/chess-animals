import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../chess";
import { extractFeatures } from "../extract";
import { featureId } from "../features";

function read({ fen, key }: { fen: string; key: string }): number {
	return extractFeatures({ position: positionFromFen(fen) })[featureId(key)];
}

describe("kingActivity", () => {
	it("is silent with every piece on the board", () => {
		expect(read({ fen: INITIAL_FEN, key: "kingActivity" })).toBe(0);
	});

	it("is level with both kings equally central", () => {
		expect(read({ fen: "8/8/5k2/8/8/2K5/8/8 w - - 0 1", key: "kingActivity" })).toBe(0);
	});

	it("scores a central king over a cornered one in a bare ending, from either seat", () => {
		// White king on d4 (centrality 6), Black's on a1 (0).
		expect(read({ fen: "8/8/8/8/3K4/8/8/k7 w - - 0 1", key: "kingActivity" })).toBe(6);
		expect(read({ fen: "8/8/8/8/3K4/8/8/k7 b - - 0 1", key: "kingActivity" })).toBe(-6);
	});

	it("fades in as material comes off", () => {
		// Two rooks still on: phase 4/24, so five sixths of the bare-ending value.
		const fen = "r7/8/8/8/3K4/8/7R/k7 w - - 0 1";
		expect(read({ fen, key: "kingActivity" })).toBeCloseTo(5);
	});
});
