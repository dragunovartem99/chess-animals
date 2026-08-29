import { INITIAL_FEN } from "chessops/fen";
import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../chess";
import { defaultishWeights } from "../../test-support/weights";
import { chooseMove } from "../policy";
import { createRng } from "../rng";

const GREEDY = { depth: 1 };

describe("chooseMove sampling", () => {
	it("replays the same move from the same seed, and spreads with temperature", () => {
		const position = positionFromFen(INITIAL_FEN);
		const weights = defaultishWeights();
		const pick = (seed: number, temperature: number) =>
			makeUci(
				chooseMove({
					position,
					weights,
					search: GREEDY,
					temperature,
					rng: createRng(seed),
				})!
			);

		expect(pick(7, 0)).toBe(pick(7, 0));

		const sampled = new Set(Array.from({ length: 30 }, (_, seed) => pick(seed, 200)));
		expect(sampled.size).toBeGreaterThan(1);
	});
});
