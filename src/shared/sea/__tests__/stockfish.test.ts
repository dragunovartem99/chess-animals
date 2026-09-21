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
	it("plays a legal move", async () => {
		await stockfish.init();

		const uci = await stockfish.bestMove({ fen: START, moves: [], nodes: 500 });

		expect(fromUci({ position: positionFromFen(START), uci: uci ?? "" })).toBeDefined();
	});

	it("is a pure function of the game at a fixed node budget", async () => {
		const ask = () => stockfish.bestMove({ fen: START, moves: ["e2e4", "e7e5"], nodes: 500 });

		await stockfish.newGame();
		const first = await ask();
		await stockfish.newGame();

		expect(await ask()).toBe(first);
	});

	it("has nothing to play once the game is over", async () => {
		const mated = "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1";

		expect(await stockfish.bestMove({ fen: mated, moves: [], nodes: 100 })).toBeUndefined();
	});
});
