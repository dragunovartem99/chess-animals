import type { Role } from "chessops/types";
import { describe, expect, it } from "vitest";

import { clipPath, clipsFor } from "../voice";

const PIECES: Record<Role, string> = {
	pawn: "пешку",
	knight: "коня",
	bishop: "слона",
	rook: "ладью",
	queen: "ферзя",
	king: "короля",
};

describe("clipPath", () => {
	it("names a line by locale, animal, remark and index, and the piece when it has one", () => {
		expect(clipPath({ locale: "en", id: "wolf", remark: "greet", index: 1 })).toBe(
			"voice/en/wolf/greet-1.mp3"
		);
		expect(
			clipPath({ locale: "ru", id: "fox", remark: "take", index: 0, piece: "queen" })
		).toBe("voice/ru/fox/take-0-queen.mp3");
	});
});

describe("clipsFor", () => {
	it("makes one clip a plain line and one a piece for a line that names it, never the king", () => {
		const clips = clipsFor({
			locale: "ru",
			id: "goat",
			lines: { check: ["Шах."], take: ["Забираю {piece}."] },
			pieces: PIECES,
		});

		expect(clips).toEqual([
			{ path: "voice/ru/goat/check-0.mp3", text: "Шах." },
			{ path: "voice/ru/goat/take-0-pawn.mp3", text: "Забираю пешку." },
			{ path: "voice/ru/goat/take-0-knight.mp3", text: "Забираю коня." },
			{ path: "voice/ru/goat/take-0-bishop.mp3", text: "Забираю слона." },
			{ path: "voice/ru/goat/take-0-rook.mp3", text: "Забираю ладью." },
			{ path: "voice/ru/goat/take-0-queen.mp3", text: "Забираю ферзя." },
		]);
	});
});
