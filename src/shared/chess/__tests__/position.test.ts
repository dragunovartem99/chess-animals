import { INITIAL_FEN } from "chessops/fen";
import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import {
	afterMove,
	fenFromPosition,
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
