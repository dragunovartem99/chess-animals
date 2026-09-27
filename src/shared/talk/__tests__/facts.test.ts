import { describe, expect, it } from "vitest";

import { afterMove, fenFromPosition, positionFromFen } from "../../chess";
import { fromUci } from "../../engine/uci/moves";
import { moveFacts } from "../facts";

// The facts of the last of `moves` played from `fen`, answered by `reply`.
function factsOf({ fen, moves, reply }: { fen: string; moves: string[]; reply?: string }) {
	let position = positionFromFen(fen);
	const fens = [fen];
	for (const uci of moves.slice(0, -1)) {
		position = afterMove({ position, move: fromUci({ position, uci })! });
		fens.push(fenFromPosition(position));
	}

	return moveFacts({ fens, moves, ply: moves.length, reply });
}

describe("moveFacts, on a piece won", () => {
	it("names a piece left hanging, for either side", () => {
		const white = "4k3/8/8/3n4/8/8/8/3RK3 w - - 0 1";
		const black = "4k3/8/8/3r4/8/8/8/3QK3 b - - 0 1";

		expect(factsOf({ fen: white, moves: ["d1d5"], reply: "e8e7" })).toEqual({
			check: false,
			won: "knight",
		});
		expect(factsOf({ fen: black, moves: ["d5d1"], reply: "e1d1" })).toEqual({
			check: true,
			won: "queen",
		});
	});

	it("names a piece given for less, as a knight for a pawn or a rook for a bishop", () => {
		const knight = "4k3/8/4p3/3p4/8/2N5/8/4K3 w - - 0 1";
		const exchange = "4k3/8/4p3/3b4/8/8/8/3RK3 w - - 0 1";

		expect(factsOf({ fen: knight, moves: ["c3d5", "e6d5"], reply: "e1e2" })).toEqual({
			check: false,
			won: "knight",
		});
		expect(factsOf({ fen: exchange, moves: ["d1d5", "e6d5"], reply: "e1e2" })).toEqual({
			check: false,
			won: "rook",
		});
	});

	it("names a piece the observer saw coming, as after a fork", () => {
		const fen = "r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1";

		expect(factsOf({ fen, moves: ["b5c7"] })).toEqual({ check: true });
		expect(factsOf({ fen, moves: ["b5c7", "e8e7", "c7a8"] })).toEqual({
			check: false,
			won: "rook",
		});
	});

	it("counts the whole run of captures, and names the best piece of it", () => {
		const fen = "4k3/8/4b3/3r4/8/8/3R4/3RK3 w - - 0 1";

		expect(factsOf({ fen, moves: ["d2d5"], reply: "e6d5" })).toEqual({ check: false });
		expect(factsOf({ fen, moves: ["d2d5", "e6d5", "d1d5"], reply: "e8e7" })).toEqual({
			check: false,
			won: "rook",
		});
	});
});

describe("moveFacts, when nothing was won", () => {
	it("says nothing of a trade or a pawn, but sees check", () => {
		const trade = "4k3/8/2p5/3n4/8/8/8/3RK3 w - - 0 1";
		const pawn = "4k3/8/8/3p4/8/8/8/3RK3 w - - 0 1";

		expect(factsOf({ fen: trade, moves: ["d1d5"], reply: "c6d5" })).toEqual({ check: false });
		expect(factsOf({ fen: pawn, moves: ["d1d5"] })).toEqual({ check: false });
		expect(factsOf({ fen: "4k3/8/8/8/8/8/8/R3K3 w - - 0 1", moves: ["a1a8"] })).toEqual({
			check: true,
		});
	});

	it("does not call castling onto its own rook a capture, nor an illegal move anything", () => {
		const fen = "4k3/8/8/8/8/8/8/4K2R w K - 0 1";

		expect(factsOf({ fen, moves: ["e1g1"] })).toEqual({ check: false });
		expect(factsOf({ fen, moves: ["e1e3"] })).toEqual({ check: false });
		expect(moveFacts({ fens: [fen], moves: [], ply: 0 })).toEqual({ check: false });
	});

	it("counts a pawn taken en passant, though the square it lands on is empty", () => {
		// Only with the pawn does the bishop won two plies later clear the bar.
		const fen = "4k3/4b3/8/3pP3/8/8/8/3RK3 w - d6 0 2";

		expect(factsOf({ fen, moves: ["e5d6", "e7d6", "d1d6"] })).toEqual({
			check: false,
			won: "bishop",
		});
	});
});
