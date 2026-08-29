import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../chess";
import { extractFeatures } from "../extract";
import { featureId } from "../features";

function read({ fen, key }: { fen: string; key: string }): number {
	return extractFeatures({ position: positionFromFen(fen) })[featureId(key)];
}

describe("centralization", () => {
	it("is level in the symmetric opening position", () => {
		for (const role of ["Pawn", "Knight", "Bishop", "Rook", "Queen", "King"]) {
			expect(read({ fen: INITIAL_FEN, key: `centralization${role}` })).toBe(0);
		}
	});

	it("scores the four central squares highest and the corners lowest", () => {
		const central = read({
			fen: "4k3/8/8/8/3N4/8/8/4K3 w - - 0 1",
			key: "centralizationKnight",
		});
		const cornered = read({
			fen: "4k3/8/8/8/8/8/8/N3K3 w - - 0 1",
			key: "centralizationKnight",
		});

		expect(central).toBe(6);
		expect(cornered).toBe(0);
	});

	it("reads the same for both colours", () => {
		const white = read({ fen: "4k3/8/8/8/3N4/8/8/4K3 w - - 0 1", key: "centralizationKnight" });
		const black = read({ fen: "4k3/8/8/3n4/8/8/8/4K3 b - - 0 1", key: "centralizationKnight" });

		expect(black).toBe(white);
	});
});

describe("advancement", () => {
	it("is level in the symmetric opening position", () => {
		expect(read({ fen: INITIAL_FEN, key: "advancementPawn" })).toBe(0);
	});

	it("counts ranks from a piece's own back rank, so both colours read alike", () => {
		const white = read({ fen: "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1", key: "advancementPawn" });
		const black = read({ fen: "4k3/4p3/8/8/8/8/8/4K3 b - - 0 1", key: "advancementPawn" });

		expect(white).toBe(1);
		expect(black).toBe(1);
	});

	it("grows as a pawn walks up the board", () => {
		const second = read({ fen: "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1", key: "advancementPawn" });
		const seventh = read({ fen: "4k3/4P3/8/8/8/8/8/4K3 w - - 0 1", key: "advancementPawn" });

		expect(seventh).toBeGreaterThan(second);
		expect(seventh).toBe(6);
	});
});
