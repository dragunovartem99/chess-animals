import { describe, expect, it } from "vitest";

import { BASES, weightsOn } from "../bases";

describe("the bases", () => {
	// Pinned, not derived. A base is the starting point bots on disk were written against, so a
	// change to one of these numbers is a change to every bot that names it — including tuned
	// weights, golden games and cached tournament results. Changing this test is the deliberate
	// act that says so; the safe move is almost always to add a new base instead.
	it("are exactly the numbers committed here", () => {
		expect(BASES).toEqual({
			zero: {},
			mate: { givesMate: 1 },
			material: {
				givesMate: 1,
				materialPawn: 100,
				materialKnight: 300,
				materialBishop: 300,
				materialRook: 500,
				materialQueen: 900,
			},
		});
	});
});

describe("weightsOn", () => {
	it("is the bot's own weights when it names no base", () => {
		expect(weightsOn({ weights: { swarm: -900 } })).toEqual({ swarm: -900 });
	});

	it("writes the bot's weights over the base", () => {
		expect(weightsOn({ base: "mate", weights: { swarm: -900 } })).toEqual({
			givesMate: 1,
			swarm: -900,
		});
	});

	// The reason a base can be a default rather than a decision: disagreeing with it costs one
	// line, so naming one never traps a bot into a value it did not want.
	it("lets a bot overrule a weight the base sets, rather than adding to it", () => {
		expect(weightsOn({ base: "material", weights: { materialQueen: 0 } }).materialQueen).toBe(
			0
		);
	});

	it("never mutates the base it was given", () => {
		weightsOn({ base: "mate", weights: { givesMate: -1 } });

		expect(BASES.mate.givesMate).toBe(1);
	});
});
