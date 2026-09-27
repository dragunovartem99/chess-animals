import { describe, expect, it } from "vitest";

import { factsOf } from "./played";

describe("moveFacts, on a piece given for less", () => {
	it("sees a piece given for less, as a knight for a pawn or a rook for a bishop", () => {
		const knight = "4k3/8/4p3/3p4/8/2N5/8/4K3 w - - 0 1";
		const exchange = "4k3/8/4p3/3b4/8/8/8/3RK3 w - - 0 1";

		expect(factsOf({ fen: knight, moves: ["c3d5", "e6d5"], line: ["e1e2"] })).toEqual({
			check: false,
			won: true,
		});
		expect(factsOf({ fen: exchange, moves: ["d1d5", "e6d5"], line: ["e1e2"] })).toEqual({
			check: false,
			won: true,
		});
	});

	it("sees a piece the observer saw coming, as after a fork", () => {
		const fen = "r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1";

		expect(factsOf({ fen, moves: ["b5c7"] })).toEqual({ check: true, won: false });
		expect(factsOf({ fen, moves: ["b5c7", "e8e7", "c7a8"] })).toEqual({
			check: false,
			won: true,
		});
	});

	it("counts the whole run of captures", () => {
		const fen = "4k3/8/4b3/3r4/8/8/3R4/3RK3 w - - 0 1";

		expect(factsOf({ fen, moves: ["d2d5"], line: ["e6d5"] })).toEqual({
			check: false,
			won: false,
		});
		expect(factsOf({ fen, moves: ["d2d5", "e6d5", "d1d5"], line: ["e8e7"] })).toEqual({
			check: false,
			won: true,
		});
	});
});

describe("moveFacts, on a recapture behind a check", () => {
	it("sees the bishop taken back after the check the observer puts first", () => {
		const fen = "rn3b1r/pbp1k1p1/1p1p1p1p/8/2B5/5N2/PPPP1PPP/RNB2RK1 b - - 3 9";
		const check = ["f1e1", "e7d8", "g2f3"];

		expect(factsOf({ fen, moves: ["b7f3"], line: check })).toEqual({
			check: false,
			won: false,
		});
		expect(factsOf({ fen, moves: ["b7f3"], line: ["g2f3", "b8c6", "c4d5"] })).toEqual({
			check: false,
			won: false,
		});
	});
});
