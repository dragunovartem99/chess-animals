import { afterAll, describe, expect, it } from "vitest";

import { createProcessTransport } from "../../monsters/process";
import { createStockfish } from "../../monsters/stockfish";
import { openings } from "../../openings";
import { goSearch } from "../../test-support/wasm";
import { runGame } from "../runGame";
import type { GameSpec } from "../types";

const stockfish = createStockfish({ transport: createProcessTransport() });
afterAll(() => stockfish.dispose());

const [opening] = openings;
const GOLDFISH = {
	id: "goldfish",
	search: { depth: 2 },
	stockfish: { nodes: 50, lines: 3, temperature: 30 },
	weights: {},
};
const MONKEY = { id: "monkey", search: { depth: 1 }, base: "material", weights: {} } as const;

const spec = (over: Partial<GameSpec> = {}): GameSpec => ({
	white: GOLDFISH,
	black: MONKEY,
	openingFen: opening.fen,
	seed: 3,
	plyLimit: 30,
	...over,
});

// The arena's own path with the real Stockfish behind it: a monster in a game, played out.
describe("runGame with a monster", () => {
	it("plays it through to the end, in either seat", async () => {
		for (const game of [spec(), spec({ white: MONKEY, black: GOLDFISH })]) {
			const report = await runGame({ spec: game, goSearch, stockfish });

			expect(report.plies).toBeGreaterThan(0);
		}
	});

	it("is a pure function of the spec, though Stockfish is a process that keeps its hash", async () => {
		const first = await runGame({ spec: spec(), goSearch, stockfish });

		expect(await runGame({ spec: spec(), goSearch, stockfish })).toEqual(first);
	});

	it("refuses a game with a monster and no Stockfish", async () => {
		await expect(runGame({ spec: spec(), goSearch })).rejects.toThrow("needs Stockfish");
	});
});
