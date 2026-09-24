import { describe, expect, it } from "vitest";

import { stressMap, stressed } from "../voice/stress";

const stress = stressMap(["ребЯтами", "зАмок"]);

describe("stressed", () => {
	it("puts the acute after the capital-marked vowel", () => {
		expect(stressed({ text: "Мы с ребятами.", stress })).toBe("Мы с ребя́тами.");
	});

	it("keeps a capital at the start of a sentence", () => {
		expect(stressed({ text: "Замок.", stress })).toBe("За́мок.");
	});

	it("leaves other words and parts of words alone", () => {
		expect(stressed({ text: "Замки и замочек", stress })).toBe("Замки и замочек");
	});
});
