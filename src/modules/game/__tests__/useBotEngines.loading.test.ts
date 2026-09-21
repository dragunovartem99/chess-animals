import { afterEach, describe, expect, it, vi } from "vitest";

import { DONKEY, WOLF, mount } from "./engines";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("useBotEngines loading", () => {
	it("reports thinking while a move is outstanding", async () => {
		const { result } = mount();
		await result.prepare([DONKEY]);

		const pending = result.askForMove({ animal: DONKEY });
		await Promise.resolve();

		expect(result.thinking.value).toBe(true);
		return pending;
	});

	it("reports loading until every prepared bot is ready", async () => {
		const { result, workers } = mount();

		const prepared = result.prepare([DONKEY, WOLF]);

		expect(result.loading.value).toBe(true);
		await prepared;
		expect(result.loading.value).toBe(false);
		expect(workers).toHaveLength(2);
	});

	it("is not thinking while a bot is still loading", () => {
		const { result } = mount();

		const pending = result.askForMove({ animal: DONKEY });

		expect(result.thinking.value).toBe(false);
		return pending;
	});
});
