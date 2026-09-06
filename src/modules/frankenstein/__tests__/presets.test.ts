import { describe, expect, it } from "vitest";

import { BASES } from "@/shared/bots";
import { FEATURES } from "@/shared/eval";

import { blankPreset, DEFAULT_DEPTH, presetFromBot } from "../utils/presets";

describe("blankPreset", () => {
	it("starts on the material base, everything else at zero", () => {
		const preset = blankPreset();

		expect(preset.depth).toBe(DEFAULT_DEPTH);
		expect(preset.quiescence).toBe(false);
		const base: Record<string, number> = BASES.material;
		for (const feature of FEATURES) {
			expect(preset.weights[feature.key]).toBe(base[feature.key] ?? 0);
		}
	});
});

describe("presetFromBot", () => {
	it("carries an animal's weights and its own search depth", () => {
		const preset = presetFromBot("hedgehog");

		expect(preset).toMatchObject({ depth: 2, quiescence: false });
		expect(preset?.weights.hanging).toBe(-100);
		expect(preset?.weights.givesMate).toBe(1);
	});

	it("fills in zero for every feature the animal does not name", () => {
		const preset = presetFromBot("hedgehog");

		expect(preset?.weights.centralization).toBe(0);
	});

	it("is undefined for an id off the roster", () => {
		expect(presetFromBot("griffin")).toBeUndefined();
	});
});
