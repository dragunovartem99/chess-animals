import { describe, expect, it } from "vitest";

import { pieceWon } from "../gain";
import { game, level } from "./heard";

describe("pieceWon", () => {
	it("names a piece left hanging, for either side", () => {
		const white = game(...level(5), [{ cp: 340 }, { captured: "knight", material: 3 }]);
		const black = game(...level(6), [{ cp: -900 }, { captured: "queen", material: -9 }]);

		expect(pieceWon({ heard: white, ply: 5 })).toBe("knight");
		expect(pieceWon({ heard: black, ply: 6 })).toBe("queen");
	});

	it("names a piece the observer saw coming, as after a fork", () => {
		const fork = game(
			...level(3),
			[{ cp: 300 }],
			[{ cp: 310 }],
			[{ cp: 320 }, { captured: "rook", material: 5 }]
		);

		expect(pieceWon({ heard: fork, ply: 5 })).toBe("rook");
	});

	it("counts the whole run of captures, and names the best piece of it", () => {
		const run = game(
			...level(5),
			[{ cp: 200 }, { captured: "rook", material: 5, settled: 2 }],
			[{ cp: 200 }, { captured: "knight", material: 2 }],
			[{ cp: 300 }, { captured: "pawn", material: 3 }]
		);

		expect(pieceWon({ heard: run, ply: 5 })).toBeUndefined();
		expect(pieceWon({ heard: run, ply: 7 })).toBe("rook");
	});
});

describe("pieceWon, when nothing was won", () => {
	it("says nothing of a trade, a pawn, or a quiet move", () => {
		const trade = game(...level(5), [
			{ cp: 700 },
			{ captured: "knight", material: 3, settled: 0 },
		]);
		const pawn = game(...level(5), [{ cp: 100 }, { captured: "pawn", material: 1 }]);

		expect(pieceWon({ heard: trade, ply: 5 })).toBeUndefined();
		expect(pieceWon({ heard: pawn, ply: 5 })).toBeUndefined();
		expect(pieceWon({ heard: game(...level(6)), ply: 5 })).toBeUndefined();
	});

	it("says nothing without the ply the run began from", () => {
		const hung = game(...level(5), [{ cp: 300 }, { captured: "knight", material: 3 }]);

		expect(pieceWon({ heard: Object.assign([], { 5: hung[5] }), ply: 5 })).toBeUndefined();
	});
});
