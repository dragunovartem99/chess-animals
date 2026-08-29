import { describe, expect, it } from "vitest";

import { ROSTER } from "../../modules/bots/roster";
import { FEATURES } from "../../shared/eval";
import { locales, messages } from "../index";

// The registry is the source of truth for what a bot can be tuned on, and the weight editor puts
// a slider on every entry. A feature with no label would render as a bare key, so adding a
// heuristic without translating it fails here rather than in the UI.
describe.each(locales)("%s labels", (locale) => {
	it("has a label for every registered feature", () => {
		const labels = messages[locale].feature as Record<string, string>;
		const missing = FEATURES.filter((feature) => !labels[feature.key]).map(
			(feature) => feature.key
		);

		expect(missing).toEqual([]);
	});

	it("has no label left over from a removed feature", () => {
		const keys = new Set(FEATURES.map((feature) => feature.key));
		const stale = Object.keys(messages[locale].feature).filter((key) => !keys.has(key));

		expect(stale).toEqual([]);
	});
});

// Same contract for the animals: an untranslated one would show up in the roster as a bare id.
describe.each(locales)("%s bot labels", (locale) => {
	it("names and describes every animal on the roster", () => {
		const bots = messages[locale].bot as Record<string, { name: string; description: string }>;
		const provided = ROSTER.map((animal) => [
			animal.definition.id,
			Object.keys(bots[animal.definition.id] ?? {}).toSorted(),
		]);

		expect(provided).toEqual(
			ROSTER.map((animal) => [animal.definition.id, ["description", "name"]])
		);
	});

	it("has no entry left over from a retired animal", () => {
		const ids = new Set(ROSTER.map((animal) => animal.definition.id));
		const stale = Object.keys(messages[locale].bot).filter((id) => !ids.has(id));

		expect(stale).toEqual([]);
	});
});
