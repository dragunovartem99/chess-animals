import { describe, expect, it } from "vitest";

import { isQuiet, isWin, mateFor } from "../swing";

describe("isWin", () => {
	it("counts a piece taken in a won game, but not a pawn", () => {
		expect(isWin({ from: { cp: 0 }, to: { cp: 300 }, side: "white" })).toBe(true);
		expect(isWin({ from: { cp: 900 }, to: { cp: 1200 }, side: "white" })).toBe(true);
		expect(isWin({ from: { cp: -900 }, to: { cp: -1200 }, side: "black" })).toBe(true);
		expect(isWin({ from: { cp: 900 }, to: { cp: 1000 }, side: "white" })).toBe(false);
		expect(isWin({ from: { cp: 900 }, to: { cp: 1200 }, side: "black" })).toBe(false);
	});

	it("leaves a mate to the mate remark", () => {
		expect(isWin({ from: { cp: 0 }, to: { mate: 3 }, side: "white" })).toBe(false);
		expect(isWin({ from: { mate: 5 }, to: { cp: 900 }, side: "white" })).toBe(false);
	});
});

describe("mateFor", () => {
	it("names the side that mates, and nobody without a mate", () => {
		expect(mateFor({ mate: 2 })).toBe("white");
		expect(mateFor({ mate: -4 })).toBe("black");
		expect(mateFor({ cp: 5000 })).toBeUndefined();
	});
});

describe("isQuiet", () => {
	it("holds the cooldown after a remark and lifts it after", () => {
		expect(isQuiet({ ply: 5, lastPly: undefined })).toBe(false);
		expect(isQuiet({ ply: 8, lastPly: 5 })).toBe(true);
		expect(isQuiet({ ply: 9, lastPly: 5 })).toBe(false);
	});
});
