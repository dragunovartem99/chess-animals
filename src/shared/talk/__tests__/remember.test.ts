import { describe, expect, it } from "vitest";

import { remember } from "../react";

const LAST = { remark: 2, mating: "black" } as const;

describe("remember", () => {
	it("forgets nothing to silence", () => {
		expect(remember({ last: LAST, said: [], ply: 5 })).toBe(LAST);
	});

	it("starts the cooldown on any remark, and keeps whose mate was said last", () => {
		const check = [{ color: "white", remark: "check" }] as const;
		const mating = [{ color: "white", remark: "mating" }] as const;

		expect(remember({ last: LAST, said: check, ply: 5 })).toEqual({ ...LAST, remark: 5 });
		expect(remember({ last: {}, said: mating, ply: 5 })).toEqual({
			remark: 5,
			mating: "white",
		});
	});

	it("takes a mate faced as the other side's mate", () => {
		const mated = [{ color: "white", remark: "mated" }] as const;

		expect(remember({ last: {}, said: mated, ply: 5 })).toEqual({ remark: 5, mating: "black" });
	});
});
