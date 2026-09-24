import { describe, expect, it } from "vitest";

import type { Line, LinesFor } from "@/shared/talk";

import { clipOf } from "../clip";

// The fox names what it takes; the wolf just takes it.
const linesFor: LinesFor = ({ id, piece }) =>
	id === "fox" ? [`Your ${piece ?? ""}, thanks.`] : ["Mine now."];

const took = (id: string, piece?: Line["piece"]): Line => ({
	key: 1,
	id,
	remark: "take",
	index: 0,
	color: "white",
	...(piece ? { piece } : {}),
});

describe("clipOf", () => {
	it("gives a line that names the piece that piece's own clip", () => {
		expect(clipOf({ line: took("fox", "queen"), locale: "ru", linesFor })).toBe(
			"voice/ru/fox/take-0-queen.mp3"
		);
	});

	it("gives a line that does not name it the one clip it has", () => {
		expect(clipOf({ line: took("wolf", "queen"), locale: "en", linesFor })).toBe(
			"voice/en/wolf/take-0.mp3"
		);
	});

	it("gives a line about no piece its one clip", () => {
		expect(clipOf({ line: took("fox"), locale: "en", linesFor })).toBe(
			"voice/en/fox/take-0.mp3"
		);
	});
});
