import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { legalMoves, positionFromFen } from "../../../chess";
import { fromUci, toUci } from "../moves";

const CASTLING = "4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1";

describe("toUci", () => {
	it("names an ordinary move by its two squares", () => {
		const position = positionFromFen(INITIAL_FEN);
		const move = legalMoves(position).find(
			(candidate) => toUci({ position, move: candidate }) === "e2e4"
		);

		expect(move).toBeDefined();
	});

	it("names castling by the king's landing square, not the rook's", () => {
		const position = positionFromFen(CASTLING);
		const uci = legalMoves(position).map((move) => toUci({ position, move }));

		expect(uci).toContain("e1g1");
		expect(uci).toContain("e1c1");
		expect(uci).not.toContain("e1h1");
	});
});

describe("fromUci", () => {
	it("reads standard castling back into the move chessops means by it", () => {
		const position = positionFromFen(CASTLING);
		const move = fromUci({ position, uci: "e1g1" })!;

		expect(move).toBeDefined();
		expect(toUci({ position, move })).toBe("e1g1");
	});

	it("round-trips every legal move in a position", () => {
		const position = positionFromFen("r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1");

		for (const move of legalMoves(position)) {
			const uci = toUci({ position, move });

			expect(toUci({ position, move: fromUci({ position, uci })! })).toBe(uci);
		}
	});

	it("round-trips a promotion, piece and all", () => {
		const position = positionFromFen("7k/3P4/8/8/8/8/8/4K3 w - - 0 1");

		expect(fromUci({ position, uci: "d7d8n" })?.promotion).toBe("knight");
	});

	it("returns undefined for a move that is not legal here", () => {
		const position = positionFromFen(INITIAL_FEN);

		expect(fromUci({ position, uci: "e2e5" })).toBeUndefined();
		expect(fromUci({ position, uci: "nonsense" })).toBeUndefined();
	});
});
