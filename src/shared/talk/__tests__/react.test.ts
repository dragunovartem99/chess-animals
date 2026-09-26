import type { Color } from "chessops/types";
import { describe, expect, it } from "vitest";

import { farewell, greet, react } from "../react";
import { game, level } from "./heard";

const BOTH: Color[] = ["white", "black"];
const KNIGHT = { captured: "knight", material: 3 } as const;

// Black leaves a knight hanging at ply 4; White takes it at ply 5.
const TAKE = {
	heard: game(...level(4), [{ cp: 350 }], [{ cp: 340 }, KNIGHT]),
	ply: 5,
	livePly: 5,
	last: {},
};

// White gives check at ply 5, and nothing else happens.
const CHECK = { ...TAKE, heard: game(...level(5), [{ cp: 0 }, { check: true }]), bots: BOTH };

// White finds a mate at ply 5.
const MATE = { ...TAKE, heard: game(...level(5), [{ mate: 3 }, { check: true }]), bots: BOTH };

describe("react to a capture", () => {
	it("lets the taker speak, or the loser when the taker is human", () => {
		expect(react({ ...TAKE, bots: BOTH })).toEqual([
			{ color: "white", remark: "take", piece: "knight" },
		]);
		expect(react({ ...TAKE, bots: ["black"] })).toEqual([
			{ color: "black", remark: "lose", piece: "knight" },
		]);
	});

	it("says nothing about the first half of a trade, or with nobody to say it", () => {
		const trade = game(...level(5), [{ cp: 0 }, { ...KNIGHT, settled: 0 }]);

		expect(react({ ...TAKE, heard: trade, bots: BOTH })).toEqual([]);
		expect(react({ ...TAKE, bots: [] })).toEqual([]);
	});
});

describe("react to a check or a mate", () => {
	it("lets the checking bot say so, and a human's check pass", () => {
		expect(react(CHECK)).toEqual([{ color: "white", remark: "check" }]);
		expect(react({ ...CHECK, bots: ["black"] })).toEqual([]);
	});

	it("puts a mate found before anything else, once a side", () => {
		const black = game(...level(5), [{ mate: -2 }]);

		expect(react(MATE)).toEqual([{ color: "white", remark: "mating" }]);
		expect(react({ ...MATE, last: { mating: "white" } })).toEqual([
			{ color: "white", remark: "check" },
		]);
		expect(react({ ...MATE, heard: black })).toEqual([{ color: "black", remark: "mating" }]);
	});

	it("says a mate found inside a cooldown once the cooldown is over", () => {
		const found = game(...level(3), [{ mate: 5 }], [{ mate: 4 }], [{ mate: 4 }]);

		expect(react({ ...MATE, heard: found, last: { remark: 3, news: 3 } })).toEqual([]);
		expect(react({ ...MATE, heard: found, ply: 5, last: { remark: 1, news: 1 } })).toEqual([
			{ color: "white", remark: "mating" },
		]);
	});
});

describe("react's timing", () => {
	it("answers a verdict one ply late, not two, and keeps the cooldown", () => {
		expect(react({ ...CHECK, livePly: 6 })).toHaveLength(1);
		expect(react({ ...CHECK, livePly: 7 })).toEqual([]);
		expect(react({ ...CHECK, last: { remark: 2 } })).toEqual([]);
		expect(react({ ...CHECK, heard: Object.assign([], { 5: CHECK.heard[5] }) })).toEqual([]);
	});

	it("lets a check's cooldown pass news, and news's cooldown hold both", () => {
		const taken = [{ color: "white", remark: "take", piece: "knight" }];

		expect(react({ ...TAKE, bots: BOTH, last: { remark: 3 } })).toEqual(taken);
		expect(react({ ...TAKE, bots: BOTH, last: { remark: 3, news: 3 } })).toEqual([]);
		expect(react({ ...CHECK, last: { remark: 3, news: 3 } })).toEqual([]);
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
