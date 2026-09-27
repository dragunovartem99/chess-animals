import { describe, expect, it } from "vitest";

import { moveFacts } from "../facts";
import { factsOf } from "./played";

describe("moveFacts, on a piece won", () => {
	it("sees a piece left hanging won, for either side", () => {
		const white = "4k3/8/8/3n4/8/8/8/3RK3 w - - 0 1";
		const black = "4k3/8/8/3r4/8/8/8/3QK3 b - - 0 1";

		expect(factsOf({ fen: white, moves: ["d1d5"], line: ["e8e7"] })).toEqual({
			check: false,
			won: true,
		});
		expect(factsOf({ fen: black, moves: ["d5d1"], line: ["e1d1"] })).toEqual({
			check: true,
			won: true,
		});
	});
});

describe("moveFacts, when nothing was won", () => {
	it("says nothing of a trade or a pawn, but sees check", () => {
		const trade = "4k3/8/2p5/3n4/8/8/8/3RK3 w - - 0 1";
		const pawn = "4k3/8/8/3p4/8/8/8/3RK3 w - - 0 1";

		expect(factsOf({ fen: trade, moves: ["d1d5"], line: ["c6d5"] })).toEqual({
			check: false,
			won: false,
		});
		expect(factsOf({ fen: pawn, moves: ["d1d5"] })).toEqual({ check: false, won: false });
		expect(factsOf({ fen: "4k3/8/8/8/8/8/8/R3K3 w - - 0 1", moves: ["a1a8"] })).toEqual({
			check: true,
			won: false,
		});
	});

	it("does not call castling onto its own rook a capture, nor an illegal move anything", () => {
		const fen = "4k3/8/8/8/8/8/8/4K2R w K - 0 1";

		expect(factsOf({ fen, moves: ["e1g1"] })).toEqual({ check: false, won: false });
		expect(factsOf({ fen, moves: ["e1e3"] })).toEqual({ check: false, won: false });
		expect(moveFacts({ fens: [fen], moves: [], ply: 0 })).toEqual({ check: false, won: false });
	});

	it("counts a pawn taken en passant, though the square it lands on is empty", () => {
		// Only with the pawn does the bishop won two plies later clear the bar.
		const fen = "4k3/4b3/8/3pP3/8/8/8/3RK3 w - d6 0 2";

		expect(factsOf({ fen, moves: ["e5d6", "e7d6", "d1d6"] })).toEqual({
			check: false,
			won: true,
		});
	});
});
