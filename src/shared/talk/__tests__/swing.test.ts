import { describe, expect, it } from "vitest";

import { isQuiet, mateFor } from "../swing";

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
