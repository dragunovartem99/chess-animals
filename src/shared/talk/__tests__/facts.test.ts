import { describe, expect, it } from "vitest";

import { moveFacts } from "../facts";

describe("moveFacts", () => {
	it("names the piece a capture takes", () => {
		const fen = "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3";

		expect(moveFacts({ fen, uci: "f3e5" })).toEqual({ captured: "pawn", check: false });
	});

	it("sees check, and a quiet move as quiet", () => {
		const fen = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";

		expect(moveFacts({ fen, uci: "d1h5" })).toEqual({ check: false });
		expect(moveFacts({ fen: "4k3/8/8/8/8/8/8/R3K3 w - - 0 1", uci: "a1a8" })).toEqual({
			check: true,
		});
	});

	it("takes a pawn en passant, though the square it lands on is empty", () => {
		const fen = "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2";

		expect(moveFacts({ fen, uci: "e5d6" })).toEqual({ captured: "pawn", check: false });
	});

	it("does not call castling onto its own rook a capture, nor an illegal move anything", () => {
		const fen = "4k3/8/8/8/8/8/8/4K2R w K - 0 1";

		expect(moveFacts({ fen, uci: "e1g1" })).toEqual({ check: false });
		expect(moveFacts({ fen, uci: "e1e3" })).toEqual({ check: false });
	});
});
