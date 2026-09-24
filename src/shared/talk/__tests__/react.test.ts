import type { Color } from "chessops/types";
import { describe, expect, it } from "vitest";

import { createRng } from "../../engine";
import type { Verdict } from "../observer";
import { PAUSE, pauseFor } from "../pause";
import { farewell, greet, react } from "../react";

const BOTH: Color[] = ["white", "black"];
const QUIET = { check: false };

// Verdicts by ply, as the conversation keeps them.
const at = (...verdicts: Verdict[]) =>
	verdicts.reduce<(Verdict | undefined)[]>((all, verdict) => {
		all[verdict.ply] = verdict;
		return all;
	}, []);

// Black leaves a knight hanging at ply 4; White takes it at ply 5.
const HUNG = at({ ply: 3, score: { cp: 0 } }, { ply: 4, score: { cp: 350 } });
const TAKE = {
	verdicts: HUNG,
	verdict: { ply: 5, score: { cp: 340 } },
	livePly: 5,
	lastPly: undefined,
};

describe("react to a capture", () => {
	it("lets the taker speak, or the loser when the taker is human", () => {
		const facts = { captured: "knight", check: false } as const;

		expect(react({ ...TAKE, facts, bots: BOTH })).toEqual([
			{ color: "white", remark: "take", piece: "knight" },
		]);
		expect(react({ ...TAKE, facts, bots: ["black"] })).toEqual([
			{ color: "black", remark: "lose", piece: "knight" },
		]);
	});

	it("says nothing about an even trade, or with nobody to say it", () => {
		const facts = { captured: "knight", check: false } as const;
		const even = {
			...TAKE,
			verdicts: at({ ply: 3, score: { cp: 0 } }, { ply: 4, score: { cp: 0 } }),
		};

		expect(
			react({ ...even, verdict: { ply: 5, score: { cp: 0 } }, facts, bots: BOTH })
		).toEqual([]);
		expect(react({ ...TAKE, facts, bots: [] })).toEqual([]);
	});
});

describe("react to a check or a mate", () => {
	it("lets the checking bot say so, and a human's check pass", () => {
		expect(react({ ...TAKE, facts: { check: true }, bots: BOTH })).toEqual([
			{ color: "white", remark: "check" },
		]);
		expect(react({ ...TAKE, facts: { check: true }, bots: ["black"] })).toEqual([]);
	});

	it("puts a mate found before anything else, and only once", () => {
		const mate = { ...TAKE, verdict: { ply: 5, score: { mate: 3 } } };
		const again = { ...mate, verdicts: at({ ply: 4, score: { mate: 4 } }) };

		expect(react({ ...mate, facts: { check: true }, bots: BOTH })).toEqual([
			{ color: "white", remark: "mating" },
		]);
		expect(react({ ...again, facts: QUIET, bots: BOTH })).toEqual([]);
	});
});

describe("react's timing", () => {
	it("answers a verdict one ply late, not two, and keeps the cooldown", () => {
		const check = { ...TAKE, facts: { check: true }, bots: BOTH };

		expect(react({ ...check, livePly: 6 })).toHaveLength(1);
		expect(react({ ...check, livePly: 7 })).toEqual([]);
		expect(react({ ...check, lastPly: 2 })).toEqual([]);
		expect(react({ ...check, verdicts: [] })).toEqual([]);
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

describe("pauseFor", () => {
	it("follows the seed, inside the bounds", () => {
		const rng = createRng(1);
		const pauses = Array.from({ length: 50 }, () => pauseFor(rng));

		expect(pauses.slice(0, 3)).toEqual([2368, 1446, 1539]);
		expect(Math.min(...pauses)).toBeGreaterThanOrEqual(PAUSE.min);
		expect(Math.max(...pauses)).toBeLessThan(PAUSE.max);
	});
});
