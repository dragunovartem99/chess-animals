import { describe, expect, it } from "vitest";

import { ROSTER } from "@/modules/bots/roster";
import { compileBot } from "@/shared/bots";

import { LAB } from "../lab";

// The bench is edited by hand between experiments and is empty the rest of the time. When it
// holds candidates, hold them to the rules its comment states: each must compile (a mistyped
// weight key throws in `compileBot`, not silently in the arena), each id must be `lab-` prefixed
// so the output can be read, and none may shadow a roster id or the cache would serve one bot's
// games for another.
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
