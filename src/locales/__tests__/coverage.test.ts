import { describe, expect, it } from "vitest";

import { ANIMALS } from "@/modules/bots/roster";
import { FEATURES } from "@/shared/eval";
import { REMARKS } from "@/shared/talk";

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
		const provided = ANIMALS.map((animal) => [
			animal.definition.id,
			Object.keys({ ...bots[animal.definition.id] }).toSorted(),
		]);

		expect(provided).toEqual(
			ANIMALS.map((animal) => [animal.definition.id, ["description", "name"]])
		);
	});

	it("has no entry left over from a retired animal", () => {
		const ids = new Set(ANIMALS.map((animal) => animal.definition.id));
		const stale = Object.keys(messages[locale].bot).filter((id) => !ids.has(id));

		expect(stale).toEqual([]);
	});
});

// And for what they say: an animal with a remark unwritten would fall silent on it in one language
// only.
describe.each(locales)("%s talk", (locale) => {
	const talk = messages[locale].talk as Record<string, Record<string, string[]>>;
	const ids = ANIMALS.map((animal) => animal.definition.id);

	it("writes every remark for every animal, and nothing more", () => {
		expect(Object.keys(talk).toSorted()).toEqual(ids.toSorted());
		expect(Object.values(talk).map((lines) => Object.keys(lines).toSorted())).toEqual(
			ids.map(() => REMARKS.toSorted())
		);
	});

	it("gives every remark a line", () => {
		const counts = Object.values(talk).flatMap((lines) =>
			Object.values(lines).map((said) => said.length)
		);

		expect(Math.min(...counts)).toBeGreaterThanOrEqual(1);
	});
});
