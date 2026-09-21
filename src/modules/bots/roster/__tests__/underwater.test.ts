import { describe, expect, it } from "vitest";

import { assertBotDefinition } from "@/shared/bots";

import { ANIMALS_BY_ID, MONSTERS, ROSTER, UNDERWATER } from "../index";

const elos = UNDERWATER.map((animal) => animal.definition.maia?.elo ?? 0);

describe("the underwater roster", () => {
	it("has sixteen animals, as every roster does", () => {
		expect([ROSTER, MONSTERS, UNDERWATER].map((roster) => roster.length)).toEqual([16, 16, 16]);
	});

	it("climbs Maia's ratings, weakest first, never the same one twice", () => {
		expect(elos).toEqual(elos.toSorted((a, b) => a - b));
		expect(new Set(elos).size).toBe(elos.length);
	});

	it("ends with the one animal that never draws its move", () => {
		const greedy = UNDERWATER.filter((animal) => animal.definition.maia?.greedy);

		expect(greedy).toEqual([UNDERWATER.at(-1)]);
	});

	it("shares no id with the other rosters", () => {
		for (const animal of UNDERWATER)
			expect(ANIMALS_BY_ID.has(animal.definition.id)).toBe(false);
	});

	it.each(UNDERWATER)("$definition.id is a valid underwater definition", (animal) => {
		expect(() => assertBotDefinition(animal.definition)).not.toThrow();
		expect(animal.definition.maia).toBeDefined();
	});
});
