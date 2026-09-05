import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { createAdjudicator, materialEdge, runGame } from "..";
import type { GameSpec } from "..";
import type { BotDefinition } from "../../bots";
import { positionFromFen } from "../../chess";

const HUNTER: BotDefinition = {
	id: "hunter",
	search: { depth: 1 },
	temperature: 40,
	weights: { materialPawn: 20, materialKnight: 60, materialRook: 100, captureValue: 8 },
};

const DRIFTER: BotDefinition = {
	id: "drifter",
	search: { depth: 1 },
	temperature: 40,
	weights: { mobility: 4, centralization: 3 },
};

const spec = (over: Partial<GameSpec> = {}): GameSpec => ({
	white: HUNTER,
	black: DRIFTER,
	openingFen: INITIAL_FEN,
	seed: 7,
	plyLimit: 120,
	...over,
});

describe("runGame", () => {
	it("is a pure function of the spec", () => {
		expect(runGame(spec())).toEqual(runGame(spec()));
	});

	it("changes with the seed", () => {
		const a = runGame(spec({ seed: 1 }));
		const b = runGame(spec({ seed: 2 }));
		expect(
			[a, b].some((report) => report.plies !== a.plies || report.result !== a.result)
		).toBe(true);
	});

	it("stops at the ply cap and calls it a draw", () => {
		const report = runGame(spec({ plyLimit: 16 }));
		expect(report).toEqual({ result: null, reason: "ply-limit", plies: 16 });
	});

	it("adjudicates a hopeless position as a resignation", () => {
		// Black has only a king; White a full army. The material edge never comes back under the
		// threshold, so White wins by resignation well before the ply cap.
		const report = runGame(
			spec({ openingFen: "4k3/8/8/8/8/8/PPPPPPPP/RNBQKBNR w KQ - 0 1", plyLimit: 200 })
		);
		expect(report.result).toBe("white");
		expect(report.reason).toBe("resigned");
		expect(report.plies).toBeLessThan(200);
	});
});

describe("materialEdge", () => {
	it("is zero at the start", () => {
		expect(materialEdge(positionFromFen(INITIAL_FEN))).toBe(0);
	});

	it("is positive when White is up and negative when Black is", () => {
		expect(materialEdge(positionFromFen("4k3/8/8/8/8/8/8/3QK3 w - - 0 1"))).toBe(9);
		expect(materialEdge(positionFromFen("rn2k3/8/8/8/8/8/8/4K3 w - - 0 1"))).toBe(-8);
	});
});

describe("createAdjudicator", () => {
	it("fires only after an unbroken run past the threshold", () => {
		const adj = createAdjudicator({ resignThreshold: 5, patience: 3 });
		expect(adj.verdict(6)).toBeUndefined();
		// One ply back under the threshold resets the streak.
		expect(adj.verdict(2)).toBeUndefined();
		expect(adj.verdict(6)).toBeUndefined();
		expect(adj.verdict(9)).toBeUndefined();
		expect(adj.verdict(6)).toBe("white");
	});

	it("tracks the black side independently", () => {
		const adj = createAdjudicator({ resignThreshold: 5, patience: 2 });
		expect(adj.verdict(-7)).toBeUndefined();
		expect(adj.verdict(-8)).toBe("black");
	});
});
