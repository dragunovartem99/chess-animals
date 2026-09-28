import { describe, expect, it } from "vitest";

import { assertBotDefinition } from "@/shared/bots";

import { ANIMALS_BY_ID, MONSTERS, ROSTER, UNDERWATER } from "../index";

const elos = (greedy: boolean) =>
	UNDERWATER.filter((animal) => Boolean(animal.definition.maia?.greedy) === greedy).map(
		(animal) => animal.definition.maia?.elo ?? 0
	);

describe("the underwater roster", () => {
	it("has sixteen animals, as every roster does", () => {
		expect([ROSTER, MONSTERS, UNDERWATER].map((roster) => roster.length)).toEqual([16, 16, 16]);
	});

	it.each([false, true])(
		"climbs Maia's ratings, greedy %s, never the same one twice",
		(greedy) => {
			expect(elos(greedy)).toEqual(elos(greedy).toSorted((a, b) => a - b));
			expect(new Set(elos(greedy)).size).toBe(elos(greedy).length);
		}
	);

	it("puts the animals that never draw their move on top, above every one that does", () => {
		const greedy = UNDERWATER.filter((animal) => animal.definition.maia?.greedy);

		expect(greedy).toEqual(UNDERWATER.slice(-greedy.length));
	});

	it("shares no id with the other rosters", () => {
		expect(ANIMALS_BY_ID.size).toBe(ROSTER.length + MONSTERS.length + UNDERWATER.length);
	});

	it.each(UNDERWATER)("$definition.id is a valid underwater definition", (animal) => {
		expect(() => assertBotDefinition(animal.definition)).not.toThrow();
		expect(animal.definition.maia).toBeDefined();
	});
});
