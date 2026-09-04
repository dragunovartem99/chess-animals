import { describe, expect, it } from "vitest";

import { FEATURE_COUNT, FEATURES } from "@/shared/eval";

import { FAMILIES, featuresByFamily } from "../utils/families";

describe("featuresByFamily", () => {
	it("partitions every feature into its own family, with none dropped or duplicated", () => {
		const grouped = featuresByFamily();
		const total = FAMILIES.reduce((sum, family) => sum + grouped[family].length, 0);

		expect(total).toBe(FEATURE_COUNT);
	});

	it("keeps each feature under the family the registry gives it", () => {
		const grouped = featuresByFamily();

		for (const feature of FEATURES) {
			expect(grouped[feature.family]).toContainEqual(feature);
		}
	});
});
