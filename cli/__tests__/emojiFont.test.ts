import { describe, expect, it } from "vitest";

import { collectEmoji, emojiFace, emojiFontUrl, woff2Url } from "../emojiFont";

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

	it("takes the one woff2 face out of google's stylesheet", () => {
		const css =
			"@font-face { src: url(https://fonts.gstatic.com/l/font?kit=a&v=1) format('woff2'); }";

		expect(woff2Url({ css })).toBe("https://fonts.gstatic.com/l/font?kit=a&v=1");
	});

	it("fails rather than guess when the stylesheet holds no single face", () => {
		expect(() => woff2Url({ css: "" })).toThrow("expected one woff2 face, got 0");
	});

	it("declares the self-hosted font under the family the styles name", () => {
		expect(emojiFace({ href: "/assets/e.woff2" })).toBe(
			'@font-face{font-family:"Noto Color Emoji";font-display:swap;src:url(/assets/e.woff2) format("woff2")}'
		);
	});
});
