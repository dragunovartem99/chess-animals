import { INITIAL_FEN } from "chessops/fen";
import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { legalMoves } from "../moves";
import { positionFromFen } from "../position";

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
