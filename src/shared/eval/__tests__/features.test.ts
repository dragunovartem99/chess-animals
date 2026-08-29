import { describe, expect, it } from "vitest";

import { defineFeatures, FEATURES, FEATURES_BY_KEY } from "../features";

const definition = { family: "material", group: "pieces", defaultWeight: 0 } as const;

describe("defineFeatures", () => {
	it("assigns dense ids in declaration order", () => {
		const features = defineFeatures([
			{ ...definition, key: "one" },
			{ ...definition, key: "two" },
			{ ...definition, key: "three" },
		]);

		expect(features.map((feature) => feature.id)).toEqual([0, 1, 2]);
	});

	it("derives an i18n key from the feature key", () => {
		const [feature] = defineFeatures([{ ...definition, key: "swarm" }]);

		expect(feature.i18nKey).toBe("feature.swarm");
	});

	it("rejects a duplicate key rather than shadowing a slider", () => {
		expect(() =>
			defineFeatures([
				{ ...definition, key: "swarm" },
				{ ...definition, key: "swarm" },
			])
		).toThrow('duplicate feature key "swarm"');
	});
});

describe("FEATURES", () => {
	it("has unique keys", () => {
		expect(new Set(FEATURES.map((feature) => feature.key)).size).toBe(FEATURES.length);
	});

	it("has ids that index the registry itself", () => {
		expect(FEATURES.every((feature, index) => feature.id === index)).toBe(true);
	});

	it("is fully reachable by key", () => {
		expect(FEATURES_BY_KEY.size).toBe(FEATURES.length);
	});
});
