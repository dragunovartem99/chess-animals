import type { Color } from "chessops/types";
import { describe, expect, it } from "vitest";

import type { Score } from "../score";
import { winChance } from "../score";
import type { Swing } from "../swing";
import { detectSwing, isQuiet } from "../swing";

// The verdict after each ply of a game, White moving first, and the swing each ply read as.
const replay = (verdicts: readonly Score[]): (Swing | undefined)[] =>
	verdicts.slice(1).map((after, index) => {
		const mover: Color = index % 2 === 0 ? "white" : "black";
		return detectSwing({ before: verdicts[index]!, after, mover });
	});

// A scripted game: the verdict after each ply, White moving first, and the swing that ply is.
const GAME: [Score, Swing | undefined][] = [
	[{ cp: 20 }, undefined],
	[{ cp: 30 }, undefined],
	// Black finds a tactic: a rise for the mover is the observer catching up, not a remark.
	[{ cp: -250 }, undefined],
	[{ cp: -240 }, undefined],
	[{ cp: 150 }, { kind: "blunder", by: "black" }],
	// White wins more while already ahead: nothing to say.
	[{ cp: 900 }, undefined],
	[{ cp: 880 }, undefined],
	[{ mate: 4 }, { kind: "mate", by: "white" }],
	// The same mate, closer, is not news.
	[{ mate: 3 }, undefined],
	[{ mate: 2 }, undefined],
];

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

describe("detectSwing", () => {
	it("reads a scripted game's eval series as its remarks", () => {
		expect(replay(GAME.map(([verdict]) => verdict))).toEqual(
			GAME.slice(1).map(([, swing]) => swing)
		);
	});

	it("keeps an even-game pawn quiet and a won-game pawn quieter", () => {
		expect(
			detectSwing({ before: { cp: 0 }, after: { cp: -100 }, mover: "white" })
		).toBeUndefined();
		expect(
			detectSwing({ before: { cp: 800 }, after: { cp: 500 }, mover: "white" })
		).toBeUndefined();
	});

	it("calls a walk into mate a mate for the other side", () => {
		expect(detectSwing({ before: { cp: 40 }, after: { mate: -2 }, mover: "white" })).toEqual({
			kind: "mate",
			by: "black",
		});
	});

	it("calls letting a mate slip into a lost game a blunder", () => {
		expect(detectSwing({ before: { mate: 2 }, after: { cp: -300 }, mover: "white" })).toEqual({
			kind: "blunder",
			by: "white",
		});
	});
});

describe("isQuiet", () => {
	it("holds the cooldown after a remark and lifts it after", () => {
		expect(isQuiet({ ply: 5, lastPly: undefined })).toBe(false);
		expect(isQuiet({ ply: 8, lastPly: 5 })).toBe(true);
		expect(isQuiet({ ply: 9, lastPly: 5 })).toBe(false);
	});
});
