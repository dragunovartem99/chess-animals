import { afterAll, describe, expect, it } from "vitest";

import { positionFromFen } from "../../chess";
import { fromUci } from "../../engine/uci/moves";
import { createProcessTransport } from "../process";
import { createStockfish } from "../stockfish";

const stockfish = createStockfish({ transport: createProcessTransport() });
afterAll(() => stockfish.dispose());

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// The one spec that runs the real vendored engine: what it says, castling notation and all, is
// Stockfish's to say and no fake can vouch for it.
describe("the vendored Stockfish", () => {
	it("offers as many legal lines as it is asked for, best first", async () => {
		await stockfish.init();

		const lines = await stockfish.lines({ fen: START, moves: [], nodes: 2000, lines: 4 });
		const scores = lines.map((line) => line.score);

		expect(lines).toHaveLength(4);
		expect(new Set(lines.map((line) => line.move)).size).toBe(4);
		for (const { move } of lines) {
			expect(fromUci({ position: positionFromFen(START), uci: move })).toBeDefined();
		}
		expect(scores).toEqual(scores.toSorted((a, b) => b - a));
	});

	it("is a pure function of the game at a fixed node budget", async () => {
		const ask = () =>
			stockfish.lines({ fen: START, moves: ["e2e4", "e7e5"], nodes: 500, lines: 3 });

		await stockfish.newGame();
		const first = await ask();
		await stockfish.newGame();

		expect(await ask()).toEqual(first);
	});

	it("has nothing to offer once the game is over", async () => {
		const mated = "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1";

		expect(await stockfish.lines({ fen: mated, moves: [], nodes: 100, lines: 3 })).toEqual([]);
	});
});
