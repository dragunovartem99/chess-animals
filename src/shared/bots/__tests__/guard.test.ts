import { describe, expect, it } from "vitest";

import { assertBotDefinition } from "../guard";
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
			expect(() => assertBotDefinition({ ...VALID, id })).toThrow(
				"id must be lower-case letters, digits and dashes"
			);
		}
	});

	it("rejects a search depth below one", () => {
		expect(() => assertBotDefinition({ ...VALID, search: { depth: 0 } })).toThrow(
			"search.depth must be a whole number of at least 1"
		);
		expect(() => assertBotDefinition({ ...VALID, search: { depth: 1.5 } })).toThrow(
			"search.depth must be a whole number of at least 1"
		);
	});

	it("rejects anything that is not an object at all", () => {
		for (const value of [null, undefined, 42, "wolf", []])
			expect(() => assertBotDefinition(value)).toThrow('invalid bot "?"');
	});
});

describe("assertBotDefinition on weights and bases", () => {
	it("rejects a weight naming a feature that does not exist", () => {
		expect(() => assertBotDefinition({ ...VALID, weights: { swrm: 1 } })).toThrow(
			'unknown feature "swrm"'
		);
	});

	it("rejects a weight that is not a finite number", () => {
		expect(() => assertBotDefinition({ ...VALID, weights: { swarm: Infinity } })).toThrow(
			'weight "swarm" is not a finite number'
		);
		expect(() => assertBotDefinition({ ...VALID, weights: { swarm: "-12" } })).toThrow(
			'weight "swarm" is not a finite number'
		);
	});

	it("rejects weights that are not a flat record of feature keys", () => {
		expect(() =>
			assertBotDefinition({ ...VALID, weights: { middlegame: { swarm: -12 } } })
		).toThrow('unknown feature "middlegame"');
		expect(() => assertBotDefinition({ ...VALID, weights: undefined })).toThrow(
			"weights are not an object"
		);
	});

	it("rejects a base that does not exist", () => {
		expect(() => assertBotDefinition({ ...VALID, base: "matrial" })).toThrow(
			'unknown base "matrial"'
		);
		expect(() => assertBotDefinition({ ...VALID, base: 7 })).toThrow('unknown base "7"');
		expect(() => assertBotDefinition({ ...VALID, base: "material" })).not.toThrow();
	});
});

describe("assertBotDefinition on monsters", () => {
	it("accepts a monster, and one without stockfish options", () => {
		expect(() =>
			assertBotDefinition({ ...VALID, stockfish: { nodes: 50, lines: 1, temperature: 0 } })
		).not.toThrow();
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
		expect(() => assertBotDefinition({ ...VALID, stockfish })).toThrow("stockfish.");
	});
});
