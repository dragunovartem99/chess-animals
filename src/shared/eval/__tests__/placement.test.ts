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
		expect(read({ fen: INITIAL_FEN, key: "centralization" })).toBe(0);
	});

	it("scores the four central squares highest and the rim lowest", () => {
		const central = read({ fen: "4k3/8/8/8/3N4/8/8/4K3 w - - 0 1", key: "centralization" });
		const cornered = read({ fen: "4k3/8/8/8/8/8/8/N3K3 w - - 0 1", key: "centralization" });

		expect(central).toBe(6);
		expect(cornered).toBe(0);
	});

	it("counts minor and major pieces but not the king or pawns", () => {
		const withPawn = read({ fen: "4k3/8/8/8/3P4/8/8/4K3 w - - 0 1", key: "centralization" });
		const kingsOnly = read({ fen: "8/8/8/8/k7/8/8/6K1 w - - 0 1", key: "centralization" });

		expect(withPawn).toBe(0);
		expect(kingsOnly).toBe(0);
	});

	it("reads the same for both colors", () => {
		const white = read({ fen: "4k3/8/8/8/3N4/8/8/4K3 w - - 0 1", key: "centralization" });
		const black = read({ fen: "4k3/8/8/3n4/8/8/8/4K3 b - - 0 1", key: "centralization" });

		expect(black).toBe(white);
	});
});
