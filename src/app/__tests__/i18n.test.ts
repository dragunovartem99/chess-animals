import { afterEach, describe, expect, it, vi } from "vitest";

import { detectLocale } from "../i18n";

function stubEnvironment({ stored, languages }: { stored?: string; languages?: string[] }) {
	vi.stubGlobal("localStorage", {
		getItem: () => stored ?? null,
		setItem: () => {},
	});
	vi.stubGlobal("navigator", { languages: languages ?? [] });
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("detectLocale", () => {
	it("prefers a remembered choice over the browser's preference", () => {
		stubEnvironment({ stored: "ru", languages: ["en-US"] });

		expect(detectLocale()).toBe("ru");
	});

	it("falls back to the browser's preference, ignoring the region", () => {
		stubEnvironment({ languages: ["ru-RU", "en-US"] });

		expect(detectLocale()).toBe("ru");
	});

	it("skips browser languages it has no strings for", () => {
		stubEnvironment({ languages: ["de-DE", "ru"] });

		expect(detectLocale()).toBe("ru");
	});

	it("falls back to English when nothing matches", () => {
		stubEnvironment({ stored: "de", languages: ["de-DE"] });

		expect(detectLocale()).toBe("en");
	});
});
