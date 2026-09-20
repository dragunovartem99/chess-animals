import { INITIAL_FEN } from "chessops/fen";
import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { assertBotDefinition, compileBot } from "@/shared/bots";
import type { BotConfig } from "@/shared/bots";
import { legalMoves, positionFromFen } from "@/shared/chess";
import { openings } from "@/shared/openings";
import { playPair } from "@/shared/test-support/play";
import { bestMove } from "@/shared/test-support/wasm";

import { ROSTER, ROSTER_BY_ID } from "../index";

// `playPair` wants only the parts of a bot that play; the id is the arena's business.
function playable(config: BotConfig) {
	return { weights: config.weights, search: config.search };
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
		const move = bestMove({
			position,
			weights: bot.weights,
			search: bot.search,
			seed: animal.definition.id,
		});

		expect(legalMoves(position).map((legal) => makeUci(legal))).toContain(move);
	});
});

describe("Donkey", () => {
	it("spreads over the whole legal move list, needing no random-mover special case", () => {
		const position = positionFromFen(INITIAL_FEN);
		const bot = compileBot(ROSTER_BY_ID.get("donkey")!.definition);
		const picks = new Set(
			Array.from({ length: 200 }, (_, seed) =>
				bestMove({ position, weights: bot.weights, search: bot.search, seed })
			)
		);

		expect(picks.size).toBeGreaterThan(15);
	});
});

// The Dove and the Lemming are the paper's `pacifist` and `generous`: they decline every capture
// or force every capture, and the arena rates both well below the Donkey (Dove 89, Lemming 466,
// Donkey 620). They are the exception to "every animal beats uniform random" — they are the two
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
