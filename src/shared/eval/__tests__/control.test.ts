import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../chess";
import { extractFeatures } from "../extract";
import { featureId } from "../features";

function read({ fen, key }: { fen: string; key: string }): number {
	return extractFeatures({ position: positionFromFen(fen) })[featureId(key)];
}

describe("centerControl", () => {
	it("is level in the symmetric opening position", () => {
		expect(read({ fen: INITIAL_FEN, key: "centerControl" })).toBe(0);
	});

	it("rewards a piece that eyes the middle", () => {
		expect(read({ fen: "4k3/8/8/8/8/2N5/8/4K3 w - - 0 1", key: "centerControl" })).toBe(2);
	});

	it("is zero for a piece that reaches none of the four squares", () => {
		expect(read({ fen: "4k3/8/8/8/8/8/8/N3K3 w - - 0 1", key: "centerControl" })).toBe(0);
	});
});

describe("space", () => {
	it("is level in the symmetric opening position", () => {
		expect(read({ fen: INITIAL_FEN, key: "space" })).toBe(0);
	});

	it("counts only what a side reaches on the far half of the board", () => {
		const advanced = read({ fen: "4k3/8/8/3N4/8/8/8/4K3 w - - 0 1", key: "space" });
		const athome = read({ fen: "4k3/8/8/8/8/8/8/3NK3 w - - 0 1", key: "space" });

		expect(advanced).toBeGreaterThan(athome);
	});
});

describe("hanging", () => {
	it("is zero when nothing is loose", () => {
		expect(read({ fen: INITIAL_FEN, key: "hanging" })).toBe(0);
	});

	it("counts the opponent's loose pieces as good news", () => {
		expect(read({ fen: "4k3/8/8/3n4/8/3R4/8/4K3 w - - 0 1", key: "hanging" })).toBe(1);
	});

	it("counts our own loose pieces against us", () => {
		expect(read({ fen: "4k3/8/8/3n4/8/3R4/8/4K3 b - - 0 1", key: "hanging" })).toBe(-1);
	});

	it("does not count a piece its own side defends", () => {
		expect(read({ fen: "4k3/3q4/8/3n4/8/3R4/8/4K3 w - - 0 1", key: "hanging" })).toBe(0);
	});

	it("never counts a king, which cannot simply be taken", () => {
		expect(read({ fen: "4k3/8/8/8/8/8/8/4KR2 w - - 0 1", key: "hanging" })).toBe(0);
	});
});
