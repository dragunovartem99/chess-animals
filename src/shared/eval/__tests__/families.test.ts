import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../chess";
import { extractFeatures } from "../extract";
import { featureId } from "../features";

function read({ fen, key }: { fen: string; key: string }): number {
	return extractFeatures({ position: positionFromFen(fen) })[featureId(key)];
}

describe("material", () => {
	it("is level in the opening position", () => {
		const features = extractFeatures({ position: positionFromFen(INITIAL_FEN) });

		for (const key of [
			"materialPawn",
			"materialKnight",
			"materialBishop",
			"materialRook",
			"materialQueen",
		]) {
			expect(features[featureId(key)]).toBe(0);
		}
	});

	it("counts the difference, not the pieces", () => {
		expect(read({ fen: "4k3/8/8/8/8/8/8/3QK3 w - - 0 1", key: "materialQueen" })).toBe(1);
	});

	it("flips sign with the side to move, so a bot plays the same way with either colour", () => {
		const fen = "4k3/8/8/8/8/8/8/3QK3";

		expect(read({ fen: `${fen} w - - 0 1`, key: "materialQueen" })).toBe(1);
		expect(read({ fen: `${fen} b - - 0 1`, key: "materialQueen" })).toBe(-1);
	});

	it("counts pawns separately from pieces", () => {
		expect(read({ fen: "4k3/pp6/8/8/8/8/PPPP4/4K3 w - - 0 1", key: "materialPawn" })).toBe(2);
	});
});

describe("mobility", () => {
	it("is level in a symmetric position", () => {
		expect(read({ fen: INITIAL_FEN, key: "mobility" })).toBe(0);
	});

	it("rewards a centralised piece over a cornered one", () => {
		expect(read({ fen: "n3k3/8/8/8/3N4/8/8/4K3 w - - 0 1", key: "mobility" })).toBe(6);
	});

	it("counts squares occupied by the enemy, but not by ourselves", () => {
		const enemyOnTarget = read({ fen: "4k3/8/2p5/8/3N4/8/8/4K3 w - - 0 1", key: "mobility" });
		const friendOnTarget = read({ fen: "4k3/8/2P5/8/3N4/8/8/4K3 w - - 0 1", key: "mobility" });

		expect(enemyOnTarget).toBe(8);
		expect(friendOnTarget).toBe(7);
	});
});

describe("safeMobility", () => {
	it("matches plain mobility when no pawn covers anything", () => {
		const fen = "4k3/8/8/8/3N4/8/8/4K3 w - - 0 1";

		expect(read({ fen, key: "safeMobility" })).toBe(read({ fen, key: "mobility" }));
	});

	it("discounts squares an enemy pawn covers", () => {
		const fen = "4k3/8/4p3/8/3N4/8/8/4K3 w - - 0 1";

		expect(read({ fen, key: "mobility" })).toBe(8);
		expect(read({ fen, key: "safeMobility" })).toBe(7);
	});
});

describe("tempo", () => {
	it("is always one, so its weight is the whole bonus", () => {
		expect(read({ fen: INITIAL_FEN, key: "tempo" })).toBe(1);
	});
});
