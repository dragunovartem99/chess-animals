import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../chess";
import { boardTokens } from "../tokens";

const AFTER_E4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// The channels set on a square, 0–5 the side to move's pawn to king, 6–11 the other side's.
const channels = (tokens: Float32Array, square: number) =>
	[...tokens.slice(square * 12, square * 12 + 12).keys()].filter(
		(channel) => tokens[square * 12 + channel] === 1
	);

describe("boardTokens", () => {
	it("sets one channel per piece", () => {
		const tokens = boardTokens(positionFromFen(START));

		expect(tokens.reduce((sum, value) => sum + value, 0)).toBe(32);
	});

	it("reads White to move as it stands", () => {
		const tokens = boardTokens(positionFromFen(START));

		expect(channels(tokens, 12)).toEqual([0]);
		expect(channels(tokens, 4)).toEqual([5]);
		expect(channels(tokens, 60)).toEqual([11]);
	});

	it("flips the board and swaps the sides when Black is to move", () => {
		const tokens = boardTokens(positionFromFen(AFTER_E4));

		// Black's e7 pawn is "ours" on e2; White's e4 pawn is "theirs" on e5.
		expect(channels(tokens, 12)).toEqual([0]);
		expect(channels(tokens, 36)).toEqual([6]);
		expect(channels(tokens, 4)).toEqual([5]);
	});
});
