import { describe, expect, it } from "vitest";

import { FEATURES } from "@/shared/eval";

import { blankPreset, DEFAULT_DEPTH, presetFromBot } from "../utils/presets";

describe("blankPreset", () => {
	it("starts material-only, at the registry defaults, everything else at zero", () => {
		const preset = blankPreset();

		expect(preset.depth).toBe(DEFAULT_DEPTH);
		expect(preset.quiescence).toBe(true);
		for (const feature of FEATURES) {
			expect(preset.weights[feature.key]).toBe(
				feature.family === "material" ? feature.defaultWeight : 0
			);
		}
	});
});

describe("presetFromBot", () => {
	it("carries an animal's weights and its own search depth", () => {
		const preset = presetFromBot("wolf");

		expect(preset).toMatchObject({ depth: 3, quiescence: false });
		expect(preset?.weights.swarm).toBe(-180);
		expect(preset?.weights.givesMate).toBe(100000);
	});

	it("fills in zero for every feature the animal does not name", () => {
		const preset = presetFromBot("wolf");

		expect(preset?.weights.pawnPassed).toBe(0);
	});

	it("is undefined for an id off the roster", () => {
		expect(presetFromBot("griffin")).toBeUndefined();
	});
});
