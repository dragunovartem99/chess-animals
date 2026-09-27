import type { Color } from "chessops/types";
import { describe, expect, it } from "vitest";

import { farewell, greet, react } from "../react";

const BOTH: Color[] = ["white", "black"];

// White takes a knight at ply 5 that it keeps.
const TAKE = {
	verdict: { ply: 5, score: { cp: 340 } },
	facts: { check: false, won: true },
	livePly: 5,
	last: {},
} as const;

// White gives check at ply 5, and nothing else happens.
const CHECK = {
	...TAKE,
	facts: { check: true, won: false },
	verdict: { ply: 5, score: { cp: 0 } },
	bots: BOTH,
};

// White finds a mate at ply 5 with a check.
const MATE = { ...CHECK, verdict: { ply: 5, score: { mate: 3 } } };

describe("react to a capture", () => {
	it("lets the taker speak, or the loser when the taker is human", () => {
		expect(react({ ...TAKE, bots: BOTH })).toEqual([{ color: "white", remark: "take" }]);
		expect(react({ ...TAKE, bots: ["black"] })).toEqual([{ color: "black", remark: "lose" }]);
	});

	it("says nothing with nobody to say it", () => {
		expect(react({ ...TAKE, bots: [] })).toEqual([]);
	});
});

describe("react to a check or a mate", () => {
	it("lets the checking bot say so, and a human's check pass", () => {
		expect(react(CHECK)).toEqual([{ color: "white", remark: "check" }]);
		expect(react({ ...CHECK, bots: ["black"] })).toEqual([]);
	});

	it("puts a mate found before anything else, once a side", () => {
		const black = { ply: 5, score: { mate: -2 } };

		expect(react(MATE)).toEqual([{ color: "white", remark: "mating" }]);
		expect(react({ ...MATE, last: { mating: "white" } })).toEqual([
			{ color: "white", remark: "check" },
		]);
		expect(react({ ...MATE, verdict: black })).toEqual([{ color: "black", remark: "mating" }]);
	});

	it("lets the bot facing a human's mate say so", () => {
		expect(react({ ...MATE, bots: ["black"] })).toEqual([{ color: "black", remark: "mated" }]);
	});

	it("says a mate or a piece won through the cooldown, but not a check", () => {
		const taken = [{ color: "white", remark: "take" }];

		expect(react({ ...MATE, last: { remark: 4 } })).toEqual([
			{ color: "white", remark: "mating" },
		]);
		expect(react({ ...TAKE, bots: BOTH, last: { remark: 4 } })).toEqual(taken);
		expect(react({ ...CHECK, last: { remark: 2 } })).toEqual([]);
		expect(react({ ...CHECK, last: { remark: 1 } })).toHaveLength(1);
	});
});

describe("react's timing", () => {
	it("answers a verdict one ply late, not two", () => {
		expect(react({ ...CHECK, livePly: 6 })).toHaveLength(1);
		expect(react({ ...CHECK, livePly: 7 })).toEqual([]);
	});
});

describe("greet and farewell", () => {
	it("has every bot say hello, White first", () => {
		expect(greet(BOTH)).toEqual([
			{ color: "white", remark: "greet" },
			{ color: "black", remark: "greet" },
		]);
	});

	it("has every bot take the result from its own side", () => {
		expect(farewell({ result: "black", bots: BOTH })).toEqual([
			{ color: "white", remark: "loss" },
			{ color: "black", remark: "win" },
		]);
		expect(farewell({ result: null, bots: ["black"] })).toEqual([
			{ color: "black", remark: "draw" },
		]);
	});
});
