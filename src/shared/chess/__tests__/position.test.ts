import { INITIAL_FEN } from "chessops/fen";
import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import {
	afterMove,
	fenFromPosition,
	legalCaptures,
	legalMoves,
	positionFromFen,
	repetitionKey,
} from "../position";

describe("positionFromFen", () => {
	it("round-trips a FEN", () => {
		expect(fenFromPosition(positionFromFen(INITIAL_FEN))).toBe(INITIAL_FEN);
	});

	it("names the offending FEN when it cannot be parsed", () => {
		expect(() => positionFromFen("not a fen")).toThrow('invalid FEN "not a fen"');
	});
});

describe("legalMoves", () => {
	it("finds the 20 opening moves", () => {
		expect(legalMoves(positionFromFen(INITIAL_FEN))).toHaveLength(20);
	});

	it("expands a promotion into one move per role", () => {
		const moves = legalMoves(positionFromFen("8/P6k/8/8/8/8/8/K7 w - - 0 1"));
		const promotions = moves
			.filter((move) => move.promotion !== undefined)
			.map((move) => makeUci(move));

		expect(promotions.toSorted()).toEqual(["a7a8b", "a7a8n", "a7a8q", "a7a8r"]);
	});

	it("returns nothing in a mated position", () => {
		expect(
			legalMoves(
				positionFromFen("rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3")
			)
		).toHaveLength(0);
	});
});

function captureUcis(fen: string): string[] {
	return legalCaptures(positionFromFen(fen)).map((move) => makeUci(move));
}

describe("legalCaptures", () => {
	it("is empty when nothing can be taken", () => {
		expect(legalCaptures(positionFromFen(INITIAL_FEN))).toHaveLength(0);
	});

	it("agrees with the legal moves that land on an enemy piece", () => {
		const fen = "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4";
		const position = positionFromFen(fen);
		const onto = legalMoves(position)
			.filter((move) =>
				position.board[position.turn === "white" ? "black" : "white"].has(move.to)
			)
			.map((move) => makeUci(move))
			.toSorted();

		expect(captureUcis(fen).toSorted()).toEqual(onto);
	});

	it("expands a capture that promotes", () => {
		expect(captureUcis("r6k/1P6/8/8/8/8/8/K7 w - - 0 1").toSorted()).toEqual([
			"b7a8b",
			"b7a8n",
			"b7a8q",
			"b7a8r",
		]);
	});

	it("leaves out a pinned piece's capture", () => {
		// The bishop on e2 is pinned to the king on e1 by the rook on e8, so bxc4-style ideas and
		// its capture of the knight on d3 are both illegal.
		expect(captureUcis("4r2k/8/8/8/8/3n4/4B3/4K3 w - - 0 1")).toHaveLength(0);
	});
});

describe("afterMove", () => {
	it("leaves the original position untouched", () => {
		const position = positionFromFen(INITIAL_FEN);
		const [move] = legalMoves(position);

		afterMove({ position, move });

		expect(fenFromPosition(position)).toBe(INITIAL_FEN);
	});
});

describe("repetitionKey", () => {
	it("ignores the move counters, so a shuffled-back position matches", () => {
		const start = positionFromFen(INITIAL_FEN);
		let position = start;
		for (const uci of ["g1f3", "g8f6", "f3g1", "f6g8"]) {
			const move = legalMoves(position).find((candidate) => makeUci(candidate) === uci)!;
			position = afterMove({ position, move });
		}

		expect(repetitionKey(position)).toBe(repetitionKey(start));
		expect(fenFromPosition(position)).not.toBe(INITIAL_FEN);
	});

	it("separates positions that differ only in side to move", () => {
		const white = positionFromFen("4k3/8/8/8/8/8/8/4K3 w - - 0 1");
		const black = positionFromFen("4k3/8/8/8/8/8/8/4K3 b - - 0 1");

		expect(repetitionKey(white)).not.toBe(repetitionKey(black));
	});
});
