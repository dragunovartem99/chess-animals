import { describe, expect, it } from "vitest";

import { defaultTuneSpec, fromVector, toVector } from "..";
import type { BotDefinition } from "../../bots";

const weights: BotDefinition["weights"] = { materialPawn: 22, mobility: 5, swarm: -10 };

describe("defaultTuneSpec", () => {
	it("covers every key the bot names", () => {
		expect(defaultTuneSpec(weights)).toEqual({
			keys: ["materialPawn", "mobility", "swarm"],
		});
	});
});

describe("toVector / fromVector", () => {
	it("round-trips the spec'd keys", () => {
		const spec = defaultTuneSpec(weights);
		const vector = toVector(weights, spec);

		expect(vector).toEqual([22, 5, -10]);
		expect(toVector(fromVector(weights, spec, vector), spec)).toEqual(vector);
	});

	it("reads a key the bot does not name as zero", () => {
		expect(toVector(weights, { keys: ["huddle"] })).toEqual([0]);
	});

	it("writes only the spec'd keys and leaves the rest alone", () => {
		const next = fromVector(weights, { keys: ["swarm"] }, [-99]);

		expect(next).toEqual({ materialPawn: 22, mobility: 5, swarm: -99 });
		// Cloned, not shared with the input.
		expect(next).not.toBe(weights);
	});

	it("adds a key the bot did not name when the spec names it", () => {
		expect(fromVector(weights, { keys: ["huddle"] }, [99]).huddle).toBe(99);
	});
});
