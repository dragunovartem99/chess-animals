import type { Color } from "chessops/types";
import { describe, expect, it } from "vitest";

import { farewell, greet, react } from "../react";

const BOTH: Color[] = ["white", "black"];

// White takes a knight at ply 5 that it keeps.
const TAKE = { ply: 5, facts: { check: false, won: true } } as const;

// White gives check at ply 5, and nothing else happens.
const CHECK = { ply: 5, facts: { check: true, won: false }, bots: BOTH };

describe("react to a capture", () => {
	it("lets the taker speak, or the loser when the taker is human", () => {
		expect(react({ ...TAKE, bots: BOTH })).toEqual([{ color: "white", remark: "take" }]);
		expect(react({ ...TAKE, bots: ["black"] })).toEqual([{ color: "black", remark: "lose" }]);
	});

	it("says nothing with nobody to say it", () => {
		expect(react({ ...TAKE, bots: [] })).toEqual([]);
	});
});

describe("react to a check", () => {
	it("lets the checking bot say so, and a human's check pass", () => {
		expect(react(CHECK)).toEqual([{ color: "white", remark: "check" }]);
		expect(react({ ...CHECK, bots: ["black"] })).toEqual([]);
	});

	it("puts a piece won before the check that won it", () => {
		expect(react({ ...CHECK, facts: { check: true, won: true } })).toEqual([
			{ color: "white", remark: "take" },
		]);
	});

	it("says nothing inside the cooldown", () => {
		expect(react({ ...TAKE, bots: BOTH, last: 4 })).toEqual([]);
		expect(react({ ...CHECK, last: 2 })).toEqual([]);
		expect(react({ ...CHECK, last: 1 })).toHaveLength(1);
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
