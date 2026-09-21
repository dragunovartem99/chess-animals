import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it, vi } from "vitest";

import type { StockfishOptions } from "../../bots";
import { compileBot } from "../../bots";
import { positionFromFen } from "../../chess";
import { seedState } from "../../engine";
import type { GoRequest, GoSearch } from "../../engine";
import { fakeStockfish } from "../../test-support/stockfish";
import type { Line } from "../lines";
import { createMover } from "../mover";

const OWN = { from: 8, to: 16 };
const bot = compileBot({ id: "owl", search: { depth: 1 }, weights: {} });
const LINES: Line[] = [
	{ move: "e2e4", score: 30 },
	{ move: "d2d4", score: 20 },
];

const request = (
	stockfish: StockfishOptions | undefined,
	seed = "s"
): GoRequest & { stockfish?: StockfishOptions } => ({
	game: { position: positionFromFen(INITIAL_FEN), fen: INITIAL_FEN, moves: [] },
	weights: bot.weights,
	search: bot.search,
	rngState: seedState(seed),
	stockfish,
});

const cold = { nodes: 50, lines: 2, temperature: 0 };
const warm = { nodes: 50, lines: 2, temperature: 30 };

function setup(offer: Line[] = LINES) {
	const goSearch = vi.fn<GoSearch>((req) => ({ move: OWN, score: 7, rngState: req.rngState }));
	const { stockfish, asked } = fakeStockfish(offer);

	return { goSearch, asked, move: createMover({ goSearch, stockfish }) };
}

describe("createMover", () => {
	it("searches a land bot as ever, and never asks Stockfish", async () => {
		const { move, goSearch, asked } = setup();

		await move(request(undefined));

		expect(goSearch).toHaveBeenCalledOnce();
		expect(asked).toEqual([]);
	});

	it("never searches a monster itself, and asks Stockfish over the game so far", async () => {
		const { move, goSearch, asked } = setup();

		const found = await move(request(cold));

		expect(found.move).toEqual({ from: 12, to: 28 });
		expect(goSearch).not.toHaveBeenCalled();
		expect(asked).toEqual([{ fen: INITIAL_FEN, moves: [], nodes: 50, lines: 2 }]);
	});

	it("has no move when Stockfish has none, and says so", async () => {
		const { move } = setup([]);

		expect((await move(request(cold))).move).toBeUndefined();
	});

	it("picks from the game's own stream: the same seed, the same move; the stream moves on", async () => {
		const { move } = setup();
		const first = await move(request(warm, "a"));

		expect(await move(request(warm, "a"))).toEqual(first);
		expect(first.rngState).not.toEqual(seedState("a"));
	});

	it("plays the close line about as often as the temperature says", async () => {
		const { move } = setup();
		let close = 0;
		for (let seed = 0; seed < 400; seed++) {
			const found = await move(request(warm, `game-${seed}`));
			if (found.move?.to === 27) close++;
		}

		// exp(-10 / 30) ≈ 0.72 against the best's 1: about 42 percent.
		expect(close).toBeGreaterThan(130);
		expect(close).toBeLessThan(210);
	});

	it("refuses a monster when there is no Stockfish to ask", async () => {
		const move = createMover({
			goSearch: () => ({ move: OWN, score: 0, rngState: seedState(1) }),
		});

		await expect(move(request(cold))).rejects.toThrow("needs Stockfish");
	});
});
