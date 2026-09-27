import { describe, expect, it } from "vitest";

import { remember } from "../react";

describe("remember", () => {
	it("starts the cooldown on any remark said, and forgets nothing to silence", () => {
		const check = [{ color: "white", remark: "check" }] as const;

		expect(remember({ last: 2, said: check, ply: 5 })).toBe(5);
		expect(remember({ last: 2, said: [], ply: 5 })).toBe(2);
		expect(remember({ said: [], ply: 5 })).toBeUndefined();
	});
});
