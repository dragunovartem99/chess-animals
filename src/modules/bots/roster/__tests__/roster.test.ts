import { INITIAL_FEN } from "chessops/fen";
import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { type BotConfig, assertBotDefinition, compileBot } from "@/shared/bots";
import { legalMoves, positionFromFen } from "@/shared/chess";
import { chooseMove } from "@/shared/engine";
import { createRng } from "@/shared/engine/rng";
import { playPair } from "@/shared/test-support/play";

import { ROSTER, ROSTER_BY_ID } from "../index";

// `playPair` wants only the parts of a bot that play; the id is the arena's business.
function playable(config: BotConfig) {
	return { weights: config.weights, search: config.search, temperature: config.temperature };
}

describe("the roster", () => {
	it("has a unique id for every animal", () => {
		expect(ROSTER_BY_ID.size).toBe(ROSTER.length);
	});

	it.each(ROSTER)("$definition.id is a valid definition", (animal) => {
		expect(() => assertBotDefinition(animal.definition)).not.toThrow();
	});

	it.each(ROSTER)("$definition.id plays a legal move from the opening position", (animal) => {
		const position = positionFromFen(INITIAL_FEN);
		const bot = compileBot(animal.definition);
		const move = chooseMove({
			position,
			weights: bot.weights,
			search: bot.search,
			temperature: bot.temperature,
			rng: createRng(animal.definition.id),
		});

		expect(legalMoves(position).some((legal) => makeUci(legal) === makeUci(move!))).toBe(true);
	});
});

describe("Donkey", () => {
	it("spreads over the whole legal move list, needing no random-mover special case", () => {
		const position = positionFromFen(INITIAL_FEN);
		const bot = compileBot(ROSTER_BY_ID.get("donkey")!.definition);
		const picks = new Set(
			Array.from({ length: 200 }, (_, seed) =>
				makeUci(
					chooseMove({
						position,
						weights: bot.weights,
						search: bot.search,
						temperature: bot.temperature,
						rng: createRng(seed),
					})!
				)
			)
		);

		expect(picks.size).toBeGreaterThan(15);
	});
});

describe("the animals against the Donkey", () => {
	// The paper's own finding: strategies with any idea at all beat uniform random play. If an
	// animal cannot manage that, its weights say something other than what its name claims.
	it.each(
		ROSTER.filter((animal) => animal.definition.id !== "donkey").map((a) => a.definition.id)
	)(
		"%s outscores it over paired games",
		(id) => {
			const animal = compileBot(ROSTER_BY_ID.get(id)!.definition);
			const donkey = compileBot(ROSTER_BY_ID.get("donkey")!.definition);

			let score = 0;
			for (const seed of [1, 2, 3]) {
				score += playPair({
					one: playable(animal),
					two: playable(donkey),
					plyLimit: 120,
					seed,
				});
			}

			expect(score).toBeGreaterThan(3);
		},
		300_000
	);
});
