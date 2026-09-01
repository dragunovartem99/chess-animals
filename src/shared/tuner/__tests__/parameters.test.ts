import { describe, expect, it } from "vitest";

import { defaultTuneSpec, fromVector, toVector } from "..";
import type { BotDefinition } from "../../bots";

const weights: BotDefinition["weights"] = {
	opening: { materialPawn: 20, mobility: 4 },
	middlegame: { materialPawn: 22, mobility: 5, swarm: -10 },
};

describe("defaultTuneSpec", () => {
	it("covers every phase the bot defines and the union of its keys", () => {
		expect(defaultTuneSpec(weights)).toEqual({
			phases: ["opening", "middlegame"],
			keys: ["materialPawn", "mobility", "swarm"],
		});
	});
});

describe("toVector / fromVector", () => {
	it("round-trips the spec'd cells, missing keys reading as zero", () => {
		const spec = defaultTuneSpec(weights);
		const vector = toVector(weights, spec);
		// opening has no `swarm`, so that cell reads 0.
		expect(vector).toEqual([20, 4, 0, 22, 5, -10]);
		expect(toVector(fromVector(weights, spec, vector), spec)).toEqual(vector);
	});

	it("writes only the spec'd cells and leaves the rest alone", () => {
		const spec = { phases: ["middlegame"] as const, keys: ["swarm"] };
		const next = fromVector(weights, { phases: [...spec.phases], keys: spec.keys }, [-99]);

		expect(next.middlegame).toEqual({ materialPawn: 22, mobility: 5, swarm: -99 });
		expect(next.opening).toEqual(weights.opening);
		// Cloned, not shared with the input.
		expect(next.opening).not.toBe(weights.opening);
	});

	it("creates a phase the bot did not define when the spec names it", () => {
		const next = fromVector(weights, { phases: ["endgame"], keys: ["materialPawn"] }, [99]);
		expect(next.endgame).toEqual({ materialPawn: 99 });
	});

	it("handles a middlegame-only bot", () => {
		const only: BotDefinition["weights"] = { middlegame: { swarm: -5 } };
		expect(defaultTuneSpec(only)).toEqual({ phases: ["middlegame"], keys: ["swarm"] });

		const next = fromVector(only, { phases: ["middlegame"], keys: ["swarm"] }, [-8]);
		expect(next).toEqual({ middlegame: { swarm: -8 } });
		expect(next.opening).toBeUndefined();
	});
});
