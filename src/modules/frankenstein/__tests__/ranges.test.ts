import { describe, expect, it } from "vitest";

import { FEATURES } from "@/shared/eval";

import { FAMILY_RANGES } from "../utils/ranges";

describe("FAMILY_RANGES", () => {
	it("gives every family a usable band", () => {
		for (const range of Object.values(FAMILY_RANGES)) {
			expect(range.min).toBeLessThan(range.max);
			expect(range.step).toBeGreaterThan(0);
		}
	});

	it("covers every family a feature actually uses", () => {
		for (const feature of FEATURES) expect(FAMILY_RANGES[feature.family]).toBeDefined();
	});
});
