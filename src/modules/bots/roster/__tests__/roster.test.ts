import { INITIAL_FEN } from "chessops/fen";
import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { type BotConfig, assertBotDefinition, compileBot } from "@/shared/bots";
import { legalMoves, positionFromFen } from "@/shared/chess";
import { chooseMove, searchRoot } from "@/shared/engine";
import { createRng } from "@/shared/engine/rng";
import { featureId } from "@/shared/eval";
import { openings } from "@/shared/openings";
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

// The Dove and the Lemming are the paper's `pacifist` and `generous`: they decline every capture
// or force every capture, and the arena rates both well below the Donkey (Dove 251, Lemming 633,
// Donkey 789). They are the exception to "every animal beats uniform random" — they are the two
// that don't, and the test holds them to that. The Dodo (`suicide_king`) is not an exception: a
// king in the open is real pressure and it beats the Donkey like the rest.
const BELOW_DONKEY = ["dove", "lemming"];

// Over the opening set rather than one start position: uniform random is a different problem from
// each of the fifty, and a single game from the initial position swings on almost nothing.
function shareAgainstDonkey({ id, seeds }: { id: string; seeds: number[] }): number {
	const animal = playable(compileBot(ROSTER_BY_ID.get(id)!.definition));
	const donkey = playable(compileBot(ROSTER_BY_ID.get("donkey")!.definition));

	let score = 0;
	for (const seed of seeds) {
		for (const opening of openings) {
			score += playPair({ one: animal, two: donkey, fen: opening.fen, plyLimit: 200, seed });
		}
	}

	return score / (seeds.length * openings.length * 2);
}

describe("the animals against the Donkey", () => {
	// The paper's own finding: strategies with any idea at all beat uniform random play. If an
	// animal cannot manage that, its weights say something other than what its name claims.
	it.each(
		ROSTER.filter(
			(animal) => ![...BELOW_DONKEY, "dodo", "donkey"].includes(animal.definition.id)
		).map((a) => a.definition.id)
	)(
		"%s outscores it over paired games",
		(id) => {
			let score = 0;
			for (const seed of [1, 2, 3]) {
				score += playPair({
					one: playable(compileBot(ROSTER_BY_ID.get(id)!.definition)),
					two: playable(compileBot(ROSTER_BY_ID.get("donkey")!.definition)),
					plyLimit: 120,
					seed,
				});
			}

			expect(score).toBeGreaterThan(3);
		},
		300_000
	);

	// The Dodo barely moves a piece from the initial position — its whole game is the king walk,
	// which needs room — so it is judged over the opening set like the two below it.
	it("is outscored by the Dodo", () => {
		expect(shareAgainstDonkey({ id: "dodo", seeds: [1, 2] })).toBeGreaterThan(0.5);
	}, 300_000);

	// The other direction, and the reason it needs the whole opening set: the margin is real but
	// not vast from one position. A Dove or Lemming that has climbed back above the Donkey has a
	// sign wrong.
	it.each(BELOW_DONKEY)(
		"is outscored by it: %s",
		(id) => {
			expect(shareAgainstDonkey({ id, seeds: [1, 2] })).toBeLessThan(0.5);
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

	function bestFrom(config: BotConfig): string {
		const position = positionFromFen(MATE_IN_ONE);
		const { scored } = searchRoot({
			position,
			weights: config.weights,
			options: { ...config.search, depth: 3 },
		});
		const best = scored.reduce((left, right) => (right.score > left.score ? right : left));

		return makeUci(best.move);
	}

	// A positive `givesMate` chases the mate; a negative one flees it. Everything that chases must
	// find the mate in one here.
	const mateSeekers = ROSTER.map((animal) => ({
		animal,
		config: compileBot(animal.definition),
	})).filter(({ config }) => config.weights[featureId("givesMate")] > 0);

	for (const { animal, config } of mateSeekers) {
		it(`is what the ${animal.definition.id} plays`, () => {
			expect(IMMEDIATE).toContain(bestFrom(config));
		});
	}

	// The Dove is the one animal that weighs mate to avoid it, so it is the one that must walk
	// past this one.
	it("is what the Dove runs from", () => {
		expect(IMMEDIATE).not.toContain(bestFrom(compileBot(ROSTER_BY_ID.get("dove")!.definition)));
	});
});
