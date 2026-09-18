import { describe, expect, it } from "vitest";

import { FEATURES_BY_KEY } from "../features";
import { defaultWeights, recordFromWeights, weightsFromRecord } from "../vector";

describe("weightsFromRecord", () => {
	it("leaves unnamed features at zero, so appending a feature cannot rewrite a saved bot", () => {
		expect([...weightsFromRecord({})].every((weight) => weight === 0)).toBe(true);
	});

	it("overrides only the features it names", () => {
		const weights = weightsFromRecord({ mobility: -5 });

		expect(weights[FEATURES_BY_KEY.get("mobility")!.id]).toBe(-5);
	});

	it("rejects a key no feature answers to, rather than dropping it silently", () => {
		expect(() => weightsFromRecord({ swrm: 1 })).toThrow('unknown feature key "swrm"');
	});
});

describe("recordFromWeights", () => {
	it("omits everything that does nothing", () => {
		expect(recordFromWeights(weightsFromRecord({}))).toEqual({});
	});

	it("keeps a registry default, which is a weight like any other once a bot is saved", () => {
		expect(recordFromWeights(defaultWeights()).mobility).toBe(4);
	});

	it("round-trips the values it does keep", () => {
		const record = { mobility: 42 };

		expect(recordFromWeights(weightsFromRecord(record))).toEqual(record);
	});
});
