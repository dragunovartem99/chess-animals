import { describe, expect, it } from "vitest";

import { FEATURES_BY_KEY } from "../features";
import { weightsFromRecord } from "../vector";

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
