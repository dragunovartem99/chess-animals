import { describe, expect, it } from "vitest";

import { createRng } from "../../engine";
import { PAUSE, pauseFor } from "../pause";

describe("pauseFor", () => {
	it("follows the seed, inside the bounds", () => {
		const rng = createRng(1);
		const pauses = Array.from({ length: 50 }, () => pauseFor(rng));

		expect(pauses.slice(0, 3)).toEqual([2368, 1446, 1539]);
		expect(Math.min(...pauses)).toBeGreaterThanOrEqual(PAUSE.min);
		expect(Math.max(...pauses)).toBeLessThan(PAUSE.max);
	});
});
