import { INITIAL_FEN } from "chessops/fen";
import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { type BotConfig, assertBotDefinition, compileBot } from "@/shared/bots";
import { legalMoves, positionFromFen } from "@/shared/chess";
import { chooseMove, searchRoot } from "@/shared/engine";
import { createRng } from "@/shared/engine/rng";
import { featureId } from "@/shared/eval";
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

// Every animal that claims to see mate used to walk straight past this one. `givesMate` was a
// weight like any other, so a mate in three scored the same 100000 as the mate in one and then
// collected three plies of positional bonus on top of it. Scoring the mate in the search instead
// — decaying with ply, replacing the evaluation rather than joining it — is what fixes it, and
// this holds the whole roster to it at once.
describe("a mate in one", () => {
	// Qh2# and Qh4# both mate at once; every other queen move mates in three at best.
	const MATE_IN_ONE = "7k/8/8/8/8/8/5Q2/6RK w - - 0 1";
	const IMMEDIATE = ["f2h2", "f2h4"];

	const mateAware = ROSTER.map((animal) => ({
		animal,
		config: compileBot(animal.definition),
	})).filter(({ config }) => config.weights[featureId("givesMate")] !== 0);

	for (const { animal, config } of mateAware) {
		it(`is what the ${animal.definition.id} plays`, () => {
			const position = positionFromFen(MATE_IN_ONE);
			const scored = searchRoot({
				position,
				weights: config.weights,
				options: { ...config.search, depth: 3 },
			});
			const best = scored.reduce((left, right) => (right.score > left.score ? right : left));

			expect(IMMEDIATE).toContain(makeUci(best.move));
		});
	}
});
