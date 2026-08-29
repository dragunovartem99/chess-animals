import { describe, expect, it } from "vitest";

import { featureId } from "../../eval";
import { compileBot } from "../compile";
import type { BotDefinition } from "../types";

const SWARM = featureId("swarm");
const PAWN = featureId("materialPawn");

const base: BotDefinition = {
	id: "wolf",
	search: { depth: 2 },
	temperature: 5,
	weights: { middlegame: { swarm: -12 } },
};

describe("compileBot", () => {
	it("carries the search and temperature through untouched", () => {
		const bot = compileBot(base);

		expect(bot.search).toEqual({ depth: 2 });
		expect(bot.temperature).toBe(5);
	});

	it("uses the middlegame for phases the definition leaves out", () => {
		const bot = compileBot(base);

		for (const phase of ["opening", "middlegame", "endgame"] as const) {
			expect(bot.weights[phase][SWARM]).toBe(-12);
		}
	});

	it("keeps a phase that is given", () => {
		const bot = compileBot({
			...base,
			weights: { middlegame: { swarm: -12 }, endgame: { swarm: -2 } },
		});

		expect(bot.weights.middlegame[SWARM]).toBe(-12);
		expect(bot.weights.endgame[SWARM]).toBe(-2);
	});

	it("leaves unnamed features silent, so a bot means exactly what its file says", () => {
		expect(compileBot(base).weights.middlegame[PAWN]).toBe(0);
	});
});
