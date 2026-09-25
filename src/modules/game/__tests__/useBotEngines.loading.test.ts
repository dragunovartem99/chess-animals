import { afterEach, describe, expect, it, vi } from "vitest";

import { DONKEY, WOLF, mount } from "./engines";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("useBotEngines loading", () => {
	it("reports loading until every prepared bot is ready", async () => {
		const { result, workers } = mount();

		const prepared = result.prepare([DONKEY, WOLF]);

		expect(result.loading.value).toBe(true);
		await prepared;
		expect(result.loading.value).toBe(false);
		expect(workers).toHaveLength(2);
	});
});
