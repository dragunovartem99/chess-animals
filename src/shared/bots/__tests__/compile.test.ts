import { describe, expect, it } from "vitest";

import { featureId } from "../../eval";
import { compileBot } from "../compile";
import type { BotDefinition } from "../types";

const SWARM = featureId("swarm");
const PAWN = featureId("materialPawn");

const base: BotDefinition = {
	id: "wolf",
	search: { depth: 2 },
	weights: { swarm: -12 },
};

describe("compileBot", () => {
	it("carries the search through untouched", () => {
		const bot = compileBot(base);

		expect(bot.search).toEqual({ depth: 2 });
	});

	it("carries a monster's options through, and gives a land animal none", () => {
		const stockfish = { nodes: 50, lines: 5, temperature: 30 };

		expect(compileBot({ ...base, stockfish }).stockfish).toEqual(stockfish);
		expect(compileBot(base).stockfish).toBeUndefined();
	});

	it("puts each named weight in its own slot", () => {
		expect(compileBot(base).weights[SWARM]).toBe(-12);
	});

	it("leaves unnamed features silent, so a bot means exactly what its file says", () => {
		expect(compileBot(base).weights[PAWN]).toBe(0);
	});
});
