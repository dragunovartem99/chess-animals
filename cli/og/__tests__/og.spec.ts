import { describe, expect, it } from "vitest";

import { emojiUri } from "../emoji";
import { loadPieceUris } from "../pieces";
import { layout } from "../scatter";

describe("loadPieceUris", () => {
	const uris = loadPieceUris();

	it("pulls all twelve cburnett pieces out of the shipped stylesheet", () => {
		expect(Object.keys(uris)).toHaveLength(12);
	});

	it("keys them by colour and role, each a base64 SVG data URI", () => {
		expect(uris["white-knight"]).toMatch(/^data:image\/svg\+xml;base64,/u);
		expect(uris["black-queen"]).toMatch(/^data:image\/svg\+xml;base64,/u);
	});
});

describe("layout", () => {
	it("keeps the row within ~1120px however big the roster gets", () => {
		for (const n of [3, 7, 12, 20]) {
			expect(layout(n).slot * n).toBeLessThanOrEqual(1122);
		}
	});

	it("caps the slot so a small roster doesn't sprawl", () => {
		expect(layout(3).slot).toBe(154);
	});

	it("drops the labels once the slot is too narrow to read one", () => {
		expect(layout(7).name).toBeGreaterThan(0);
		expect(layout(16).name).toBe(0);
	});
});

describe("emojiUri", () => {
	it("returns the cached Noto SVG as a data URI", async () => {
		expect(await emojiUri("🐴")).toMatch(/^data:image\/svg\+xml;base64,/u);
	});

	it("ignores the FE0F variation selector when resolving the file", async () => {
		// 🐿️ is U+1F43F U+FE0F; Noto names the file 1f43f.svg.
		await expect(emojiUri("🐿️")).resolves.toMatch(/^data:image/u);
	});
});
