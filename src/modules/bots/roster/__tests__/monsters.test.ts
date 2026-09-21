import { describe, expect, it } from "vitest";

import { assertBotDefinition } from "@/shared/bots";

import { ANIMALS_BY_ID, ROSTER, ROSTER_BY_ID, MONSTERS } from "../index";

describe("the monsters roster", () => {
	it("has twelve animals, and ends with the one that is never careless and sees furthest", () => {
		const nodes = MONSTERS.map((animal) => animal.definition.stockfish?.nodes ?? 0);

		expect(MONSTERS).toHaveLength(12);
		expect(MONSTERS.at(-1)?.definition.stockfish?.temperature).toBe(0);
		expect(Math.max(...nodes)).toBe(nodes.at(-1));
	});

	it("is ordered by how carefully it plays, weakest first", () => {
		const temperatures = MONSTERS.map(
			(animal) => animal.definition.stockfish?.temperature ?? 0
		);

		expect(temperatures).toEqual(temperatures.toSorted((a, b) => b - a));
	});

	it("keeps its animals off the land roster, which the arena rates", () => {
		for (const animal of MONSTERS) expect(ROSTER_BY_ID.has(animal.definition.id)).toBe(false);
	});

	it("gives no two animals the same Stockfish settings", () => {
		const own = MONSTERS.map(({ definition }) => JSON.stringify(definition.stockfish));

		expect(new Set(own).size).toBe(MONSTERS.length);
	});

	it("has a unique id across both rosters", () => {
		expect(ANIMALS_BY_ID.size).toBe(ROSTER.length + MONSTERS.length);
	});

	it.each(MONSTERS)("$definition.id is a valid monster definition", (animal) => {
		expect(() => assertBotDefinition(animal.definition)).not.toThrow();
		expect(animal.definition.stockfish).toBeDefined();
	});
});
