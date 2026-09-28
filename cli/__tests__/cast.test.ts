import { describe as suite, expect, it } from "vitest";

import { ANIMALS } from "@/modules/bots/roster";

import { CAST } from "../voice/casting";
import { describe } from "../voice/describe";

// `cast.yaml` is typed only by the cast it is read into, so a missing or misspelled field would
// reach ElevenLabs as "undefined" in a paid prompt. Voice Design takes a description of 20–1000
// characters.
suite("the cast", () => {
	it("casts every animal and nobody else", () => {
		expect(Object.keys(CAST).toSorted()).toEqual(
			ANIMALS.map((animal) => animal.definition.id).toSorted()
		);
	});

	it("gives every animal a whole entry and a prompt Voice Design takes", () => {
		const said = expect.stringMatching(/\S/u);
		for (const cast of Object.values(CAST)) {
			expect(cast).toEqual({
				voice: said,
				gender: expect.stringMatching(/^(?:male|female|genderless)$/u),
				age: said,
				persona: said,
				emotion: said,
				delivery: said,
				character: said,
				speaks: expect.stringMatching(/^(?:he|she|we)$/u),
			});
			expect(describe(cast).length).toBeLessThanOrEqual(1000);
		}
	});
});
