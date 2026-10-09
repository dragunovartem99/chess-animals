import { describe, expect, it } from "vitest";

import { ROSTER } from "@/modules/bots/roster";
import { compileBot } from "@/shared/bots";

import { LAB } from "../lab";

// Each candidate must compile (a bad weight key throws here, not silently in the arena), be `lab-`
// prefixed, and not shadow a roster id, or the cache serves it another bot's games.
describe("the lab bench", () => {
	const rosterIds = new Set(ROSTER.map((animal) => animal.definition.id));

	it("holds only compiling, uniquely lab- prefixed candidates", () => {
		for (const definition of LAB) expect(() => compileBot(definition)).not.toThrow();

		const ids = LAB.map((definition) => definition.id);
		expect(ids.filter((id) => !id.startsWith("lab-"))).toEqual([]);
		expect(new Set(ids).size).toBe(ids.length);
		expect(ids.filter((id) => rosterIds.has(id))).toEqual([]);
	});
});
