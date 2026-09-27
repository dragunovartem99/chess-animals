import { describe, expect, it } from "vitest";

import { clipPath, clipsFor } from "../voice";

describe("clipPath", () => {
	it("names a line by locale, animal, remark and index", () => {
		expect(clipPath({ locale: "en", id: "wolf", remark: "greet", index: 1 })).toBe(
			"voice/en/wolf/greet-1.mp3"
		);
	});
});

describe("clipsFor", () => {
	it("makes one clip a line", () => {
		const clips = clipsFor({
			locale: "ru",
			id: "goat",
			lines: { check: ["Шах."], take: ["Моё.", "Забираю."] },
		});

		expect(clips).toEqual([
			{ path: "voice/ru/goat/check-0.mp3", text: "Шах." },
			{ path: "voice/ru/goat/take-0.mp3", text: "Моё." },
			{ path: "voice/ru/goat/take-1.mp3", text: "Забираю." },
		]);
	});
});
