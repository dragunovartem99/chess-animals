import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../chess";
import { createContext } from "../families/context";

function phase(fen: string): number {
	return createContext({ position: positionFromFen(fen) }).phase;
}

describe("phase", () => {
	it("is 1 with every piece on the board", () => {
		expect(phase(INITIAL_FEN)).toBe(1);
	});

	it("is 0 with only kings and pawns left", () => {
		expect(phase("8/8/3k4/8/3K4/8/8/8 w - - 0 1")).toBe(0);
		expect(phase("4k3/pp6/8/8/8/8/6PP/4K3 w - - 0 1")).toBe(0);
	});

	it("counts a rook as two minors and a queen as four", () => {
		expect(phase("r5k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1")).toBeCloseTo(4 / 24);
		expect(phase("3qk3/8/8/8/8/8/8/2N1K3 w - - 0 1")).toBeCloseTo(5 / 24);
	});

	it("caps at 1 when promotions leave more material than the start", () => {
		expect(phase("QQQQkQQQ/8/8/8/8/8/8/4K3 b - - 0 1")).toBe(1);
	});
});
