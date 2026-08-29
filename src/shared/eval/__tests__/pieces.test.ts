import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../chess";
import { extractFeatures } from "../extract";
import { featureId } from "../features";

function read({ fen, key }: { fen: string; key: string }): number {
	return extractFeatures({ position: positionFromFen(fen) })[featureId(key)];
}

describe("bishopPair", () => {
	it("is level when both sides have both bishops", () => {
		expect(read({ fen: INITIAL_FEN, key: "bishopPair" })).toBe(0);
	});

	it("is one pair, not one per bishop", () => {
		expect(read({ fen: "4k3/8/8/8/8/8/8/2B1KB2 w - - 0 1", key: "bishopPair" })).toBe(1);
	});

	it("needs two bishops to count at all", () => {
		expect(read({ fen: "4k3/8/8/8/8/8/8/2B1K3 w - - 0 1", key: "bishopPair" })).toBe(0);
	});
});

describe("rookOpenFile", () => {
	it("counts a file with no pawns of either colour", () => {
		expect(read({ fen: "4k3/8/8/8/8/8/8/R3K3 w - - 0 1", key: "rookOpenFile" })).toBe(1);
	});

	it("does not count a file its own pawn still blocks", () => {
		expect(read({ fen: "4k3/8/8/8/8/8/P7/R3K3 w - - 0 1", key: "rookOpenFile" })).toBe(0);
	});

	it("does not count a file an enemy pawn blocks", () => {
		expect(read({ fen: "4k3/p7/8/8/8/8/8/R3K3 w - - 0 1", key: "rookOpenFile" })).toBe(0);
	});
});

describe("rookSeventh", () => {
	it("reads the same rank for both colours, counted from their own side", () => {
		const white = read({ fen: "4k3/R7/8/8/8/8/8/4K3 w - - 0 1", key: "rookSeventh" });
		const black = read({ fen: "4k3/8/8/8/8/8/r7/4K3 b - - 0 1", key: "rookSeventh" });

		expect(white).toBe(1);
		expect(black).toBe(1);
	});

	it("is zero for a rook on its own back rank", () => {
		expect(read({ fen: "4k3/8/8/8/8/8/8/R3K3 w - - 0 1", key: "rookSeventh" })).toBe(0);
	});
});

describe("knightOutpost", () => {
	it("counts a pawn-defended knight no enemy pawn can challenge", () => {
		expect(read({ fen: "4k3/8/8/3N4/2P5/8/8/4K3 w - - 0 1", key: "knightOutpost" })).toBe(1);
	});

	it("does not count a knight its own pawns do not defend", () => {
		expect(read({ fen: "4k3/8/8/3N4/8/8/2P5/4K3 w - - 0 1", key: "knightOutpost" })).toBe(0);
	});

	it("does not count a square an enemy pawn can still come to attack", () => {
		expect(read({ fen: "4k3/2p5/8/3N4/2P5/8/8/4K3 w - - 0 1", key: "knightOutpost" })).toBe(0);
	});

	it("still counts when the enemy pawn is already past the square", () => {
		expect(read({ fen: "4k3/8/8/3N4/2P5/2p5/8/4K3 w - - 0 1", key: "knightOutpost" })).toBe(1);
	});
});
