import { describe, expect, it } from "vitest";

import { assertBotDefinition } from "@/shared/bots";

import { ANIMALS_BY_ID, ROSTER, ROSTER_BY_ID, SEA } from "../index";

describe("the sea roster", () => {
	it("has twelve animals, and ends with the one that is never careless and sees furthest", () => {
		const nodes = SEA.map((animal) => animal.definition.stockfish?.nodes ?? 0);

		expect(SEA).toHaveLength(12);
		expect(SEA.at(-1)?.definition.stockfish?.temperature).toBe(0);
		expect(Math.max(...nodes)).toBe(nodes.at(-1));
	});

	it("is ordered by how carefully it plays, weakest first", () => {
		const temperatures = SEA.map((animal) => animal.definition.stockfish?.temperature ?? 0);

		expect(temperatures).toEqual(temperatures.toSorted((a, b) => b - a));
	});

	it("keeps its animals off the land roster, which the arena rates", () => {
		for (const animal of SEA) expect(ROSTER_BY_ID.has(animal.definition.id)).toBe(false);
	});

	it("gives no two animals the same Stockfish settings", () => {
		const own = SEA.map(({ definition }) => JSON.stringify(definition.stockfish));

		expect(new Set(own).size).toBe(SEA.length);
	});

	it("has a unique id across both rosters", () => {
		expect(ANIMALS_BY_ID.size).toBe(ROSTER.length + SEA.length);
	});

	it.each(SEA)("$definition.id is a valid sea definition", (animal) => {
		expect(() => assertBotDefinition(animal.definition)).not.toThrow();
		expect(animal.definition.stockfish).toBeDefined();
	});
});
