import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../chess";
import { extractFeatures } from "../extract";
import { FEATURE_COUNT, FEATURES_BY_KEY, featureId } from "../features";
import {
	createFeatureVector,
	defaultWeights,
	dot,
	recordFromWeights,
	weightsFromRecord,
} from "../vector";

describe("createFeatureVector", () => {
	it("is one slot per registered feature, zeroed", () => {
		const vector = createFeatureVector();

		expect(vector).toHaveLength(FEATURE_COUNT);
		expect([...vector].every((value) => value === 0)).toBe(true);
	});
});

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

describe("dot", () => {
	it("sums the products over the slots it is given", () => {
		const features = Float32Array.from([1, 2, 3]);
		const weights = Float32Array.from([10, 20, 30]);

		expect(dot({ features, weights, slots: [0, 1, 2] })).toBe(140);
	});

	// The slot list is what a bot weighs, so anything outside it is weighted zero by definition
	// and adds nothing — skipping it is an optimisation, never a change of score.
	it("ignores everything outside them, which is weighted zero anyway", () => {
		const features = Float32Array.from([1, 2, 3]);
		const weights = Float32Array.from([10, 0, 30]);

		expect(dot({ features, weights, slots: [0, 2] })).toBe(100);
	});

	it("scores a real position against real weights", () => {
		const weights = weightsFromRecord({ materialQueen: 10 });
		const features = extractFeatures({
			position: positionFromFen("4k3/8/8/8/8/8/8/3QK3 w - - 0 1"),
		});

		expect(dot({ features, weights, slots: [featureId("materialQueen")] })).toBe(10);
	});
});
