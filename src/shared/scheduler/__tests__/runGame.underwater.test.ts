import { describe, expect, it } from "vitest";

import { openings } from "../../openings";
import { goSearch } from "../../test-support/wasm";
import { createMaiaSession } from "../../underwater";
import { readMaiaModel } from "../../underwater/model";
import { runGame } from "../runGame";
import type { GameSpec } from "../types";

// The real model, loaded once for the file. A Maia move is ~140 ms on one thread — several times
// that with the rest of the suite on every core — so the games here are cut short, the point being
// the path and not the result, and the file gets a timeout that loading the model fits in.
const maia = createMaiaSession({ load: readMaiaModel });

const [opening] = openings;
const SHRIMP = { id: "shrimp", search: { depth: 1 }, maia: { elo: 600 }, weights: {} };
const MONKEY = { id: "monkey", search: { depth: 1 }, base: "material", weights: {} } as const;

const spec = (over: Partial<GameSpec> = {}): GameSpec => ({
	white: SHRIMP,
	black: MONKEY,
	openingFen: opening.fen,
	seed: 3,
	plyLimit: 4,
	...over,
});

// The arena's own path with the real Maia behind it: an underwater animal in a game, played out.
describe("runGame with an underwater animal", { timeout: 30_000 }, () => {
	it("plays in either seat", async () => {
		const white = await runGame({ spec: spec(), goSearch, maia });
		const black = await runGame({
			spec: spec({ white: MONKEY, black: SHRIMP }),
			goSearch,
			maia,
		});

		expect([white.plies, black.plies]).toEqual([4, 4]);
	});

	it("is a pure function of the spec, though every move is sampled", async () => {
		const first = await runGame({ spec: spec(), goSearch, maia });

		expect(await runGame({ spec: spec(), goSearch, maia })).toEqual(first);
	});

	it("refuses a game with an underwater animal and no Maia", async () => {
		await expect(runGame({ spec: spec(), goSearch })).rejects.toThrow("needs Maia");
	});
});
