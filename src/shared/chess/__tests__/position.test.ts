import { INITIAL_FEN } from "chessops/fen";
import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { legalMoves } from "../moves";
import { afterMove, fenFromPosition, positionFromFen, repetitionKey } from "../position";

describe("positionFromFen", () => {
	it("round-trips a FEN", () => {
		expect(fenFromPosition(positionFromFen(INITIAL_FEN))).toBe(INITIAL_FEN);
	});

	it("names the offending FEN when it cannot be parsed", () => {
		expect(() => positionFromFen("not a fen")).toThrow('invalid FEN "not a fen"');
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
