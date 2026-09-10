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

describe("passedPawnPush", () => {
	it("is silent with every piece on the board", () => {
		expect(read({ fen: INITIAL_FEN, key: "passedPawnPush" })).toBe(0);
	});

	it("scores a passer by how far it has run, from either seat", () => {
		// A white pawn on d7, six ranks from home, nothing to stop it.
		expect(read({ fen: "7k/3P4/8/8/8/8/8/4K3 w - - 0 1", key: "passedPawnPush" })).toBe(6);
		expect(read({ fen: "7k/3P4/8/8/8/8/8/4K3 b - - 0 1", key: "passedPawnPush" })).toBe(-6);
	});

	it("ignores pawns an enemy pawn blocks or guards the path of", () => {
		const blocked = "4k3/8/8/3p4/3P4/8/8/4K3 w - - 0 1";
		const guarded = "4k3/8/2p5/8/3P4/8/8/4K3 w - - 0 1";

		expect(read({ fen: blocked, key: "passedPawnPush" })).toBe(0);
		expect(read({ fen: guarded, key: "passedPawnPush" })).toBe(0);
	});

	it("fades in as material comes off", () => {
		// Two rooks still on, so five sixths of the d7 passer's six.
		const fen = "r6k/3P4/8/8/8/8/1R6/4K3 w - - 0 1";
		expect(read({ fen, key: "passedPawnPush" })).toBeCloseTo(5);
	});
});

describe("attackEnemyPawns", () => {
	it("is silent with every piece on the board", () => {
		expect(read({ fen: INITIAL_FEN, key: "attackEnemyPawns" })).toBe(0);
	});

	it("counts the enemy pawns a king attacks in a bare ending, from either seat", () => {
		// White king on c4 hits the d3 pawn; the pawn hits c2 and e2, where there is nothing.
		expect(read({ fen: "4k3/8/8/8/2K5/3p4/8/8 w - - 0 1", key: "attackEnemyPawns" })).toBe(1);
		expect(read({ fen: "4k3/8/8/8/2K5/3p4/8/8 b - - 0 1", key: "attackEnemyPawns" })).toBe(-1);
	});

	it("is level when the pawns attack each other", () => {
		expect(read({ fen: "4k3/8/8/8/3p4/4P3/8/4K3 w - - 0 1", key: "attackEnemyPawns" })).toBe(0);
	});

	it("fades in as material comes off", () => {
		// The rook hits a7 up the open file; one rook on is phase 2/24.
		const fen = "4k3/pp6/8/8/8/8/6PP/R3K3 w - - 0 1";
		expect(read({ fen, key: "attackEnemyPawns" })).toBeCloseTo(11 / 12);
	});
});
