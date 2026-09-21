import { describe, expect, it } from "vitest";

import { assertBotDefinition, isBotDefinition } from "../guard";
import type { BotDefinition } from "../types";

const SHRIMP: BotDefinition = {
	id: "shrimp",
	search: { depth: 1 },
	maia: { elo: 600 },
	weights: {},
};

describe("assertBotDefinition on an underwater animal", () => {
	it("accepts a rating, greedy or not", () => {
		expect(isBotDefinition(SHRIMP)).toBe(true);
		expect(isBotDefinition({ ...SHRIMP, maia: { elo: 2500, greedy: true } })).toBe(true);
	});

	it.each([{ elo: 0 }, { elo: -600 }, { elo: Infinity }, { elo: "600" }, {}, "maia", null])(
		"rejects maia options %j",
		(maia) => {
			expect(isBotDefinition({ ...SHRIMP, maia })).toBe(false);
		}
	);

	it("rejects a greedy that is not a flag", () => {
		expect(isBotDefinition({ ...SHRIMP, maia: { elo: 600, greedy: "yes" } })).toBe(false);
	});

	it("rejects a bot played by Maia and Stockfish both", () => {
		const both = { ...SHRIMP, stockfish: { nodes: 50, lines: 1, temperature: 0 } };

		expect(() => assertBotDefinition(both)).toThrow("maia and stockfish together");
	});
});
