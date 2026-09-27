import { describe, expect, it } from "vitest";

import { isQuiet } from "../cooldown";

describe("isQuiet", () => {
	it("holds the cooldown after a remark and lifts it after", () => {
		expect(isQuiet({ ply: 5, lastPly: undefined })).toBe(false);
		expect(isQuiet({ ply: 8, lastPly: 5 })).toBe(true);
		expect(isQuiet({ ply: 9, lastPly: 5 })).toBe(false);
	});
});
