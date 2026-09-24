import type { Color } from "chessops/types";
import { describe, expect, it } from "vitest";

import { createRng } from "../../engine";
import { PAUSE, pauseFor } from "../pause";
import { farewell, greet, react } from "../react";

const BOTH: Color[] = ["white", "black"];

// Black's move at ply 4 hangs a piece: White's win chance jumps.
const HANG = { before: { ply: 3, score: { cp: 0 } }, verdict: { ply: 4, score: { cp: 400 } } };
// White's move at ply 5 finds a mate.
const MATE = { before: { ply: 4, score: { cp: 400 } }, verdict: { ply: 5, score: { mate: 3 } } };

const quiet = { livePly: 5, lastPly: undefined };

describe("react", () => {
	it("lets the side a blunder helped gloat, or the blunderer groan when that side is human", () => {
		expect(react({ ...HANG, ...quiet, bots: BOTH })).toEqual([
			{ color: "white", remark: "gloat" },
		]);
		expect(react({ ...HANG, ...quiet, bots: ["black"] })).toEqual([
			{ color: "black", remark: "groan" },
		]);
	});

	it("lets the mating side say so, or the mated one when the mater is human", () => {
		expect(react({ ...MATE, ...quiet, bots: BOTH })).toEqual([
			{ color: "white", remark: "mating" },
		]);
		expect(react({ ...MATE, ...quiet, bots: ["black"] })).toEqual([
			{ color: "black", remark: "mated" },
		]);
	});

	it("says nothing for a human against a human, or for a quiet move", () => {
		expect(react({ ...HANG, ...quiet, bots: [] })).toEqual([]);
		expect(
			react({ ...HANG, verdict: { ply: 4, score: { cp: 20 } }, ...quiet, bots: BOTH })
		).toEqual([]);
	});

	it("still answers a verdict one ply late, not two", () => {
		expect(react({ ...HANG, bots: BOTH, livePly: 5, lastPly: undefined })).toHaveLength(1);
		expect(react({ ...HANG, bots: BOTH, livePly: 6, lastPly: undefined })).toEqual([]);
	});

	it("keeps quiet inside the cooldown, and without the verdict just before", () => {
		expect(react({ ...HANG, bots: BOTH, livePly: 4, lastPly: 2 })).toEqual([]);
		expect(react({ ...HANG, before: undefined, ...quiet, bots: BOTH })).toEqual([]);
		expect(
			react({ ...HANG, before: { ply: 2, score: { cp: 0 } }, ...quiet, bots: BOTH })
		).toEqual([]);
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
