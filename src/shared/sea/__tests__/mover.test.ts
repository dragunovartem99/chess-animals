import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it, vi } from "vitest";

import { compileBot } from "../../bots";
import { positionFromFen } from "../../chess";
import { seedState } from "../../engine";
import type { GoRequest, GoSearch } from "../../engine";
import { fakeStockfish } from "../../test-support/stockfish";
import { createMover } from "../mover";

const OWN = { from: 8, to: 16 };
const bot = compileBot({ id: "owl", search: { depth: 1 }, weights: {} });

const request = (mix: number | undefined, seed = "s"): GoRequest & { stockfish?: never } =>
	({
		game: { position: positionFromFen(INITIAL_FEN), fen: INITIAL_FEN, moves: [] },
		weights: bot.weights,
		search: bot.search,
		rngState: seedState(seed),
		stockfish: mix === undefined ? undefined : { nodes: 50, mix },
	}) as never;

function setup(sfMove: string | null = "e2e4") {
	const goSearch = vi.fn<GoSearch>((req) => ({ move: OWN, score: 7, rngState: req.rngState }));
	const { stockfish, asked } = fakeStockfish(sfMove ?? undefined);

	return { goSearch, asked, move: createMover({ goSearch, stockfish }) };
}

describe("createMover", () => {
	it("searches a land bot as ever, and never asks Stockfish", async () => {
		const { move, goSearch, asked } = setup();

		await move(request(undefined));

		expect(goSearch).toHaveBeenCalledOnce();
		expect(asked).toEqual([]);
	});

	it("plays the animal's own search at a mix of a hundred", async () => {
		const { move, goSearch, asked } = setup();

		const found = await move(request(100));

		expect(found.move).toEqual(OWN);
		expect(goSearch).toHaveBeenCalledOnce();
		expect(asked).toEqual([]);
	});

	it("plays Stockfish's move at a mix of zero, over the game so far", async () => {
		const { move, goSearch, asked } = setup("e2e4");

		const found = await move(request(0));

		expect(found.move).toEqual({ from: 12, to: 28 });
		expect(goSearch).not.toHaveBeenCalled();
		expect(asked).toEqual([{ fen: INITIAL_FEN, moves: [], nodes: 50 }]);
	});

	it("has no move when Stockfish has none, and says so", async () => {
		const { move } = setup(null);

		expect((await move(request(0))).move).toBeUndefined();
	});

	it("rolls from the game's own stream: the same seed, the same who; the stream moves on", async () => {
		const { move } = setup();
		const first = await move(request(0, "a"));

		expect((await move(request(0, "a"))).rngState).toEqual(first.rngState);
		expect(first.rngState).not.toEqual(seedState("a"));
	});

	it("plays its own search for about the share it says", async () => {
		const { move, goSearch } = setup();
		for (let seed = 0; seed < 400; seed++) await move(request(25, `game-${seed}`));

		expect(goSearch.mock.calls.length).toBeGreaterThan(70);
		expect(goSearch.mock.calls.length).toBeLessThan(130);
	});

	it("refuses a sea animal when there is no Stockfish to ask", async () => {
		const move = createMover({
			goSearch: () => ({ move: OWN, score: 0, rngState: seedState(1) }),
		});

		await expect(move(request(0))).rejects.toThrow("needs Stockfish");
	});
});
