import { describe, expect, it } from "vitest";

import { winChance } from "../score";
import { gained, isQuiet, mateFor } from "../swing";

describe("winChance", () => {
	it("is even at zero and certain at mate", () => {
		expect(winChance({ cp: 0 })).toBe(0.5);
		expect(winChance({ mate: 3 })).toBe(1);
		expect(winChance({ mate: -1 })).toBe(0);
	});

	it("is symmetric between the sides", () => {
		expect(winChance({ cp: 250 }) + winChance({ cp: -250 })).toBeCloseTo(1);
	});
});

describe("gained", () => {
	it("weighs a pawn more in a level game than in a won one", () => {
		const level = gained({ from: { cp: 0 }, to: { cp: 300 }, side: "white" });
		const won = gained({ from: { cp: 900 }, to: { cp: 1200 }, side: "white" });

		expect(level).toBeGreaterThan(0.25);
		expect(won).toBeLessThan(0.05);
	});

	it("is the other side's loss", () => {
		expect(gained({ from: { cp: 0 }, to: { cp: 300 }, side: "black" })).toBeCloseTo(
			-gained({ from: { cp: 0 }, to: { cp: 300 }, side: "white" })
		);
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
