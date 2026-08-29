import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../chess";
import { extractFeatures } from "../extract";
import { FEATURE_COUNT, FEATURES_BY_KEY } from "../features";
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
	it("fills unnamed features with their defaults", () => {
		expect([...weightsFromRecord({})]).toEqual([...defaultWeights()]);
	});

	it("overrides only the features it names", () => {
		const weights = weightsFromRecord({ tempo: -5 });

		expect(weights[FEATURES_BY_KEY.get("tempo")!.id]).toBe(-5);
	});

	it("rejects a key no feature answers to, rather than dropping it silently", () => {
		expect(() => weightsFromRecord({ swrm: 1 })).toThrow('unknown feature key "swrm"');
	});
});

describe("recordFromWeights", () => {
	it("omits everything left at its default", () => {
		expect(recordFromWeights(defaultWeights())).toEqual({});
	});

	it("round-trips the values it does keep", () => {
		const record = { tempo: 42 };

		expect(recordFromWeights(weightsFromRecord(record))).toEqual(record);
	});
});

describe("dot", () => {
	it("sums the products", () => {
		expect(dot(Float32Array.from([1, 2, 3]), Float32Array.from([10, 20, 30]))).toBe(140);
	});

	it("throws on a length mismatch instead of scoring half a position", () => {
		expect(() => dot(Float32Array.from([1]), Float32Array.from([1, 2]))).toThrow(
			"length mismatch"
		);
	});

	it("scores a real position against real weights", () => {
		const features = extractFeatures({ position: positionFromFen(INITIAL_FEN) });

		expect(dot(features, weightsFromRecord({ tempo: 10 }))).toBe(10);
	});
});
