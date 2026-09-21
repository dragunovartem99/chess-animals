import { describe, expect, it } from "vitest";

import { assertBotDefinition } from "@/shared/bots";

import { ANIMALS_BY_ID, ROSTER, ROSTER_BY_ID, SEA } from "../index";

describe("the sea roster", () => {
	it("has sixteen animals, and ends with the one that is not diluted", () => {
		expect(SEA).toHaveLength(16);
		expect(SEA.at(-1)?.definition.stockfish?.mix).toBe(0);
	});

	it("keeps its animals off the land roster, which the arena rates", () => {
		for (const animal of SEA) expect(ROSTER_BY_ID.has(animal.definition.id)).toBe(false);
	});

	it("gives no two animals the same search and weights, as on the land roster", () => {
		const own = SEA.map(({ definition: { search, base, weights } }) =>
			JSON.stringify({ search, base, weights })
		);

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
