import { describe, expect, it } from "vitest";

import { collectEmoji, emojiFontUrl } from "../emojiFont";

describe("the emoji font subset", () => {
	it("keeps each emoji once, sorted, and drops plain text", () => {
		expect(collectEmoji({ sources: ['emoji: "🦊"', "<span>🌞 Chess — 🦊</span>"] })).toBe(
			"🌞🦊"
		);
	});

	it("keeps the joiner and selector that sequences need", () => {
		const text = collectEmoji({ sources: ["🐦‍⬛", "🕷️"] });

		expect([...text]).toEqual(expect.arrayContaining(["🐦", "⬛", "‍", "🕷", "️"]));
	});

	it("encodes the glyphs into a request for the emoji family alone", () => {
		expect(emojiFontUrl({ text: "🦊" })).toBe(
			"https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap&text=%F0%9F%A6%8A"
		);
	});
});
