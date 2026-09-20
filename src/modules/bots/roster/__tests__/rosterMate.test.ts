import { describe, expect, it } from "vitest";

import { compileBot } from "@/shared/bots";
import type { BotConfig } from "@/shared/bots";
import { positionFromFen } from "@/shared/chess";
import { featureId } from "@/shared/eval";
import { bestMove } from "@/shared/test-support/wasm";

import { ROSTER, ROSTER_BY_ID } from "../index";

// Every animal that claims to see mate used to walk straight past this one. `givesMate` was a
// weight like any other, so a mate in three scored the same 100000 as the mate in one and then
// collected three plies of positional bonus on top of it. Scoring the mate in the search instead
// — decaying with ply, replacing the evaluation rather than joining it — is what fixes it, and
// this holds the whole roster to it at once.
describe("a mate in one", () => {
	// Qh2# and Qh4# both mate at once; every other queen move mates in three at best.
	const MATE_IN_ONE = "7k/8/8/8/8/8/5Q2/6RK w - - 0 1";
	const IMMEDIATE = ["f2h2", "f2h4"];

	function bestFrom(config: BotConfig): string | undefined {
		const position = positionFromFen(MATE_IN_ONE);
		const search = { ...config.search, depth: 3 };

		return bestMove({ position, weights: config.weights, search });
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
