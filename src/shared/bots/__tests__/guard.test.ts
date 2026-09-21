import { describe, expect, it } from "vitest";

import { assertBotDefinition, isBotDefinition } from "../guard";
import type { BotDefinition } from "../types";

const VALID: BotDefinition = {
	id: "swarm-wolf",
	search: { depth: 1 },
	weights: { swarm: -12 },
};

describe("assertBotDefinition", () => {
	it("accepts a well-formed bot", () => {
		expect(() => assertBotDefinition(VALID)).not.toThrow();
	});

	it("names the bot in the error, since a roster fails one file at a time", () => {
		expect(() => assertBotDefinition({ ...VALID, search: { depth: 0 } })).toThrow(
			'invalid bot "swarm-wolf": search.depth must be a whole number of at least 1'
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

	it("rejects anything that is not an object at all", () => {
		for (const value of [null, undefined, 42, "wolf", []])
			expect(isBotDefinition(value)).toBe(false);
	});
});

describe("assertBotDefinition on weights, bases and monsters", () => {
	it("rejects a weight naming a feature that does not exist", () => {
		expect(() => assertBotDefinition({ ...VALID, weights: { swrm: 1 } })).toThrow(
			'unknown feature "swrm"'
		);
	});

	it("rejects a weight that is not a finite number", () => {
		expect(isBotDefinition({ ...VALID, weights: { swarm: Infinity } })).toBe(false);
		expect(isBotDefinition({ ...VALID, weights: { swarm: "-12" } })).toBe(false);
	});

	it("rejects weights that are not a flat record of feature keys", () => {
		expect(isBotDefinition({ ...VALID, weights: { middlegame: { swarm: -12 } } })).toBe(false);
		expect(isBotDefinition({ ...VALID, weights: undefined })).toBe(false);
	});

	it("rejects a base that does not exist", () => {
		expect(isBotDefinition({ ...VALID, base: "matrial" })).toBe(false);
		expect(isBotDefinition({ ...VALID, base: 7 })).toBe(false);
		expect(isBotDefinition({ ...VALID, base: "material" })).toBe(true);
	});

	it("accepts a monster, and one without stockfish options", () => {
		expect(
			isBotDefinition({ ...VALID, stockfish: { nodes: 50, lines: 1, temperature: 0 } })
		).toBe(true);
	});

	it.each([
		{ nodes: 0, lines: 5, temperature: 10 },
		{ nodes: 50.5, lines: 5, temperature: 10 },
		{ nodes: 50, lines: 0, temperature: 10 },
		{ nodes: 50, lines: 2.5, temperature: 10 },
		{ nodes: 50, lines: 5, temperature: -1 },
		{ nodes: 50, lines: 5, temperature: Infinity },
		{ nodes: 50, lines: 5, temperature: "hot" },
		{ nodes: 50, mix: 10 },
		{ lines: 5, temperature: 10 },
		"stockfish",
		null,
	])("rejects stockfish options %j", (stockfish) => {
		expect(isBotDefinition({ ...VALID, stockfish })).toBe(false);
	});
});
