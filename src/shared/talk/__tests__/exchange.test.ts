import { describe, expect, it } from "vitest";

import { factsOf } from "./played";

const WON = { check: false, won: true };
const QUIET = { check: false, won: false };

describe("moveFacts, on a piece given for less", () => {
	it("sees a piece given for less, as a knight for a pawn or a rook for a bishop", () => {
		const knight = "4k3/8/4p3/3p4/8/2N5/8/4K3 w - - 0 1";
		const exchange = "4k3/8/4p3/3b4/8/8/8/3RK3 w - - 0 1";

		expect(factsOf({ fen: knight, moves: ["c3d5"] })).toEqual(QUIET);
		expect(factsOf({ fen: knight, moves: ["c3d5", "e6d5"] })).toEqual(WON);
		expect(factsOf({ fen: exchange, moves: ["d1d5", "e6d5"] })).toEqual(WON);
	});

	it("sees a piece won by a fork", () => {
		const fen = "r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1";

		expect(factsOf({ fen, moves: ["b5c7"] })).toEqual({ check: true, won: false });
		expect(factsOf({ fen, moves: ["b5c7", "e8e7", "c7a8"] })).toEqual(WON);
	});

	it("sees a run of captures won from the first that locks the gain in", () => {
		const fen = "4k3/8/4b3/3r4/8/8/3R4/3RK3 w - - 0 1";

		expect(factsOf({ fen, moves: ["d2d5"] })).toEqual(WON);
		expect(factsOf({ fen, moves: ["d2d5", "e6d5"] })).toEqual(QUIET);
		expect(factsOf({ fen, moves: ["d2d5", "e6d5", "d1d5"] })).toEqual(WON);
	});
});

describe("moveFacts, on a trade", () => {
	it("does not count a piece taken on another square", () => {
		const fen = "4k3/1b4p1/7n/8/8/8/8/2B1K2Q w - - 0 1";

		expect(factsOf({ fen, moves: ["c1h6"] })).toEqual(QUIET);
		expect(factsOf({ fen, moves: ["c1h6", "g7h6"] })).toEqual(QUIET);
		expect(factsOf({ fen, moves: ["c1h6", "g7h6", "h1b7"] })).toEqual(WON);
	});

	it("sees a recapture a pin does not allow, and one a king may not make", () => {
		// The e-pawn is pinned to its king, and the d8 king cannot take on the defended d7.
		const pinned = "4k3/4p3/3n4/8/8/8/4R3/3QK3 w - - 0 1";
		const defended = "3k4/3n4/8/8/8/8/3R4/3QK3 w - - 0 1";

		expect(factsOf({ fen: pinned, moves: ["d1d6"] })).toEqual(WON);
		expect(factsOf({ fen: defended, moves: ["d2d7"] })).toEqual({ check: true, won: true });
	});
});
