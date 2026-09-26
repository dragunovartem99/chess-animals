import { describe, expect, it, vi } from "vitest";

import type { Stockfish } from "../../monsters";
import { MATE } from "../../monsters/lines";
import { createObserver } from "../observer";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const BLACK_TO_MOVE = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

// Lets the queue reach its next question before the test looks.
const settle = () =>
	new Promise<void>((resolve) => {
		setTimeout(resolve);
	});

// A Stockfish whose every answer is held until the test gives it, so a question can still be out
// when the game moves on.
function heldStockfish() {
	const held: ((score: number | undefined) => void)[] = [];
	const asked: number[] = [];
	const said: string[] = [];
	const stockfish: Stockfish = {
		init: () => Promise.resolve(),
		newGame: () => {
			said.push("ucinewgame");
			return Promise.resolve();
		},
		lines: ({ moves, nodes }) => {
			asked.push(moves.length);
			said.push(`go nodes ${nodes}`);
			return new Promise((resolve) => {
				held.push((score) => resolve(score === undefined ? [] : [{ move: "e2e4", score }]));
			});
		},
		dispose: () => undefined,
	};

	return { stockfish, held, asked, said };
}

describe("the observer", () => {
	it("gives White's view whoever is to move, and unfolds mate", async () => {
		const { stockfish, held } = heldStockfish();
		const observer = createObserver({ stockfish });

		const white = observer.observe({ fen: START, moves: [] });
		const black = observer.observe({ fen: START, moves: ["e2e4"] });
		const fromBlack = observer.observe({ fen: BLACK_TO_MOVE, moves: [] });
		const mated = observer.observe({ fen: START, moves: ["f2f3", "e7e5", "g2g4"] });
		await [30, 40, -25, MATE - 1].reduce(
			(done, score) => done.then(settle).then(() => held.shift()!(score)),
			Promise.resolve()
		);

		expect(await white).toEqual({ ply: 0, score: { cp: 30 }, reply: "e2e4" });
		expect(await black).toEqual({ ply: 1, score: { cp: -40 }, reply: "e2e4" });
		expect(await fromBlack).toEqual({ ply: 0, score: { cp: 25 }, reply: "e2e4" });
		expect(await mated).toEqual({ ply: 3, score: { mate: -1 }, reply: "e2e4" });
	});

	it("asks one question at a time, in order, on a fixed budget", async () => {
		const { stockfish, held, asked, said } = heldStockfish();
		const observer = createObserver({ stockfish, nodes: 900 });

		void observer.observe({ fen: START, moves: [] });
		void observer.observe({ fen: START, moves: ["e2e4"] });
		await settle();
		expect(asked).toEqual([0]);

		held.shift()!(0);
		await settle();
		expect(asked).toEqual([0, 1]);
		expect(said).toEqual(["go nodes 900", "go nodes 900"]);
	});
});

describe("the observer, once the game has moved on", () => {
	it("drops an answer about a game that was reset, and one still waiting to be asked", async () => {
		const { stockfish, held, asked, said } = heldStockfish();
		const observer = createObserver({ stockfish });

		const out = observer.observe({ fen: START, moves: [] });
		const waiting = observer.observe({ fen: START, moves: ["e2e4"] });
		await settle();
		observer.reset();
		const fresh = observer.observe({ fen: START, moves: [] });
		held.shift()!(30);
		await settle();
		held.shift()!(10);

		expect(await out).toBeUndefined();
		expect(await waiting).toBeUndefined();
		expect(await fresh).toEqual({ ply: 0, score: { cp: 10 }, reply: "e2e4" });
		expect(asked).toEqual([0, 0]);
		expect(said).toEqual(["go nodes 50000", "ucinewgame", "go nodes 50000"]);
	});

	it("has no verdict once the game is over, and survives a failed question", async () => {
		const { stockfish, held } = heldStockfish();
		const lines = vi
			.fn<Stockfish["lines"]>(stockfish.lines)
			.mockRejectedValueOnce(new Error("gone"));
		const flaky: Stockfish = { ...stockfish, lines };
		const observer = createObserver({ stockfish: flaky });

		await expect(observer.observe({ fen: START, moves: [] })).rejects.toThrow("gone");
		const over = observer.observe({ fen: START, moves: [] });
		await settle();
		held.shift()!(undefined);

		expect(await over).toBeUndefined();
	});
});
