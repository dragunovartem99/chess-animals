import { describe, expect, it } from "vitest";

import { assertBotDefinition } from "@/shared/bots";

import { MONSTERS, ROSTER_BY_ID } from "../index";

// One entry per monster that has Stockfish settings, so its length checks that they all do.
const SETTINGS = MONSTERS.flatMap((animal) => animal.definition.stockfish ?? []);

describe("the monsters roster", () => {
	it("has sixteen animals, and ends with the one that is never careless and sees furthest", () => {
		const nodes = SETTINGS.map((settings) => settings.nodes);

		expect(MONSTERS).toHaveLength(16);
		expect(SETTINGS).toHaveLength(16);
		expect(SETTINGS.at(-1)?.temperature).toBe(0);
		expect(Math.max(...nodes)).toBe(nodes.at(-1));
	});

	it("is ordered by how carefully it plays, weakest first", () => {
		const temperatures = SETTINGS.map((settings) => settings.temperature);

		expect(temperatures).toEqual(temperatures.toSorted((a, b) => b - a));
	});

	it("keeps its animals off the land roster, which the arena rates", () => {
		for (const animal of MONSTERS) expect(ROSTER_BY_ID.has(animal.definition.id)).toBe(false);
	});

	it("gives no two animals the same Stockfish settings", () => {
		const own = MONSTERS.map(({ definition }) => JSON.stringify(definition.stockfish));

		expect(new Set(own).size).toBe(MONSTERS.length);
	});

	it.each(MONSTERS)("$definition.id is a valid monster definition", (animal) => {
		expect(() => assertBotDefinition(animal.definition)).not.toThrow();
		expect(animal.definition.stockfish).toBeDefined();
	});
});
