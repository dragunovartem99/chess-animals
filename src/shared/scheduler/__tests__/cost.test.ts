import { describe, expect, it } from "vitest";

import { botCost, takeCostliest } from "..";
import type { GameSpec } from "..";
import type { BotDefinition } from "../../bots";

const land: BotDefinition = {
	id: "land",
	search: { depth: 3, quiescence: true },
	weights: {},
};
const monster: BotDefinition = {
	id: "monster",
	search: { depth: 1 },
	weights: {},
	stockfish: { nodes: 5000, lines: 5, temperature: 50 },
};
const fish: BotDefinition = {
	id: "fish",
	search: { depth: 1 },
	weights: {},
	maia: { elo: 1500 },
};

const spec = (white: BotDefinition, black: BotDefinition): GameSpec => ({
	white,
	black,
	openingFen: "fen",
	seed: 1,
	plyLimit: 10,
});

describe("botCost", () => {
	it("orders maia over stockfish over the engine at any depth", () => {
		expect(botCost(fish)).toBeGreaterThan(botCost(monster));
		expect(botCost(monster)).toBeGreaterThan(botCost(land));
	});
});

describe("takeCostliest", () => {
	it("takes the dearest side's game first, the earliest among equals", () => {
		const queue = [
			{ spec: spec(land, land), tag: "ll" },
			{ spec: spec(monster, land), tag: "ml" },
			{ spec: spec(land, fish), tag: "lf" },
			{ spec: spec(fish, monster), tag: "fm" },
		];
		const order = Array.from({ length: 4 }, () => takeCostliest(queue)?.tag);
		expect(order).toEqual(["lf", "fm", "ml", "ll"]);
		expect(queue).toEqual([]);
	});

	it("returns nothing from an empty queue", () => {
		expect(takeCostliest([])).toBeUndefined();
	});
});
