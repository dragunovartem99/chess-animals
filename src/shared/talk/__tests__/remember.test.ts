import { describe, expect, it } from "vitest";

import { remember } from "../react";

const LAST = { remark: 2, news: 1, mating: "black" } as const;

describe("remember", () => {
	it("forgets nothing to silence", () => {
		expect(remember({ last: LAST, said: [], ply: 5 })).toBe(LAST);
	});

	it("starts only the check's cooldown on a check", () => {
		const said = [{ color: "white", remark: "check" }] as const;

		expect(remember({ last: LAST, said, ply: 5 })).toEqual({ ...LAST, remark: 5 });
	});

	it("starts both on news, and keeps whose mate was said", () => {
		const taken = [{ color: "white", remark: "take", piece: "rook" }] as const;
		const mating = [{ color: "white", remark: "mating" }] as const;

		expect(remember({ last: LAST, said: taken, ply: 5 })).toEqual({
			remark: 5,
			news: 5,
			mating: "black",
		});
		expect(remember({ last: {}, said: mating, ply: 5 })).toEqual({
			remark: 5,
			news: 5,
			mating: "white",
		});
	});
});
