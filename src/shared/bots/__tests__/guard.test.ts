import { describe, expect, it } from "vitest";

import { assertBotDefinition, isBotDefinition } from "../guard";
import type { BotDefinition } from "../types";

const VALID: BotDefinition = {
	id: "swarm-wolf",
	search: { depth: 1 },
	temperature: 0,
	weights: { middlegame: { swarm: -12 } },
};

describe("assertBotDefinition", () => {
	it("accepts a well-formed bot", () => {
		expect(() => assertBotDefinition(VALID)).not.toThrow();
	});

	it("names the bot in the error, since a roster fails one file at a time", () => {
		expect(() => assertBotDefinition({ ...VALID, temperature: -1 })).toThrow(
			'invalid bot "swarm-wolf": temperature must be zero or more'
		);
	});

	it("rejects an id that could not be a url segment or a cache key", () => {
		for (const id of ["Swarm Wolf", "", "3wolves", "wolf_2"]) {
			expect(isBotDefinition({ ...VALID, id })).toBe(false);
		}
	});

	it("rejects a search depth below one", () => {
		expect(isBotDefinition({ ...VALID, search: { depth: 0 } })).toBe(false);
		expect(isBotDefinition({ ...VALID, search: { depth: 1.5 } })).toBe(false);
	});

	it("rejects a weight naming a feature that does not exist", () => {
		expect(() =>
			assertBotDefinition({ ...VALID, weights: { middlegame: { swrm: 1 } } })
		).toThrow('names unknown feature "swrm"');
	});

	it("rejects a weight that is not a finite number", () => {
		expect(isBotDefinition({ ...VALID, weights: { middlegame: { swarm: Infinity } } })).toBe(
			false
		);
		expect(isBotDefinition({ ...VALID, weights: { middlegame: { swarm: "-12" } } })).toBe(
			false
		);
	});

	it("requires the middlegame, which the other phases fall back to", () => {
		expect(isBotDefinition({ ...VALID, weights: { opening: { swarm: -12 } } })).toBe(false);
	});

	it("rejects anything that is not an object at all", () => {
		for (const value of [null, undefined, 42, "wolf", []])
			expect(isBotDefinition(value)).toBe(false);
	});
});
