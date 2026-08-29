import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { gamePhase } from "../phase";
import { positionFromFen } from "../position";

describe("gamePhase", () => {
	it("reads the opening position as 0", () => {
		expect(gamePhase(positionFromFen(INITIAL_FEN))).toBe(0);
	});

	it("reads bare kings as 1", () => {
		expect(gamePhase(positionFromFen("4k3/8/8/8/8/8/8/4K3 w - - 0 1"))).toBe(1);
	});

	it("ignores pawns, so a pawn endgame is still fully endgame", () => {
		expect(gamePhase(positionFromFen("4k3/pppppppp/8/8/8/8/PPPPPPPP/4K3 w - - 0 1"))).toBe(1);
	});

	it("moves monotonically as pieces come off", () => {
		const bothQueens = gamePhase(positionFromFen("3qk3/8/8/8/8/8/8/3QK3 w - - 0 1"));
		const oneQueen = gamePhase(positionFromFen("3qk3/8/8/8/8/8/8/4K3 w - - 0 1"));

		expect(bothQueens).toBeCloseTo(1 - 8 / 24);
		expect(oneQueen).toBeGreaterThan(bothQueens);
	});

	it("clamps a promoted-up position rather than going negative", () => {
		expect(gamePhase(positionFromFen("qqqqkqqq/8/8/8/8/8/8/QQQQKQQQ w - - 0 1"))).toBe(0);
	});
});
