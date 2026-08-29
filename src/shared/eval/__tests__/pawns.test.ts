import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../chess";
import { extractFeatures } from "../extract";
import { featureId } from "../features";

function read({ fen, key }: { fen: string; key: string }): number {
	return extractFeatures({ position: positionFromFen(fen) })[featureId(key)];
}

describe("pawn structure in the opening position", () => {
	it("is level on every trait", () => {
		const keys = [
			"pawnDoubled",
			"pawnIsolated",
			"pawnBackward",
			"pawnIslands",
			"pawnConnected",
			"pawnPassed",
			"pawnPassedAdvancement",
			"pawnShield",
		];

		for (const key of keys) expect(read({ fen: INITIAL_FEN, key })).toBe(0);
	});
});

describe("pawnDoubled", () => {
	it("counts each extra pawn on a file, not each file", () => {
		expect(read({ fen: "4k3/8/8/8/P7/P7/P7/4K3 w - - 0 1", key: "pawnDoubled" })).toBe(2);
	});
});

describe("pawnIsolated", () => {
	it("counts a pawn with no neighbour on either side", () => {
		expect(read({ fen: "4k3/8/8/8/8/8/P5P1/4K3 w - - 0 1", key: "pawnIsolated" })).toBe(2);
	});

	it("does not count a pawn with a neighbour, whatever rank it stands on", () => {
		expect(read({ fen: "4k3/8/8/8/1P6/8/P7/4K3 w - - 0 1", key: "pawnIsolated" })).toBe(0);
	});
});

describe("pawnConnected", () => {
	it("counts a pawn defended from behind, but not the base of the chain defending it", () => {
		expect(read({ fen: "4k3/8/8/8/1P6/P7/8/4K3 w - - 0 1", key: "pawnConnected" })).toBe(1);
	});

	it("counts a phalanx standing shoulder to shoulder", () => {
		expect(read({ fen: "4k3/8/8/8/8/8/PP6/4K3 w - - 0 1", key: "pawnConnected" })).toBe(2);
	});

	it("does not count a lone pawn", () => {
		expect(read({ fen: "4k3/8/8/8/8/8/P7/4K3 w - - 0 1", key: "pawnConnected" })).toBe(0);
	});
});

describe("pawnPassed", () => {
	it("counts a pawn with nothing of theirs ahead on three files", () => {
		expect(read({ fen: "4k3/8/8/3P4/8/8/8/4K3 w - - 0 1", key: "pawnPassed" })).toBe(1);
	});

	it("is not passed while an enemy pawn holds a neighbouring file ahead", () => {
		expect(read({ fen: "4k3/2p5/8/3P4/8/8/8/4K3 w - - 0 1", key: "pawnPassed" })).toBe(0);
	});

	it("is passed once the only enemy pawn nearby is behind it", () => {
		// Black's c4 is passed too, so the difference is what is asserted here: both sides one.
		expect(read({ fen: "4k3/8/8/3P4/2p5/8/8/4K3 w - - 0 1", key: "pawnPassed" })).toBe(0);
	});

	it("does not count the rear pawn of a doubled pair as passed", () => {
		expect(read({ fen: "4k3/8/3P4/3P4/8/8/8/4K3 w - - 0 1", key: "pawnPassed" })).toBe(1);
	});

	it("scores advancement by rank from its own side", () => {
		expect(read({ fen: "7k/3P4/8/8/8/8/8/4K3 w - - 0 1", key: "pawnPassedAdvancement" })).toBe(
			6
		);
	});
});

describe("pawnIslands", () => {
	it("counts contiguous runs of files, not pawns", () => {
		expect(read({ fen: "4k3/8/8/8/8/8/PPP2PP1/4K3 w - - 0 1", key: "pawnIslands" })).toBe(2);
	});
});

describe("pawnBackward", () => {
	it("counts a pawn its neighbours have left behind and an enemy pawn holds down", () => {
		// White's c2 cannot advance (d4 covers c3) and b4 has gone past it. Black's own pawns
		// defend each other, so the difference isolates White's weakness.
		expect(read({ fen: "4k3/8/8/4p3/1P1p4/8/2P5/4K3 w - - 0 1", key: "pawnBackward" })).toBe(1);
	});

	it("does not count a pawn a neighbour is still behind to defend", () => {
		expect(read({ fen: "4k3/4p3/3p4/8/2P5/1P6/8/4K3 w - - 0 1", key: "pawnBackward" })).toBe(0);
	});
});

describe("pawnShield", () => {
	it("counts pawns one or two ranks in front of the king, on his file and its neighbours", () => {
		expect(read({ fen: "4k3/8/8/8/8/8/5PPP/6K1 w - - 0 1", key: "pawnShield" })).toBe(3);
	});

	it("does not count pawns that have run too far ahead of him", () => {
		expect(read({ fen: "4k3/8/8/8/5PPP/8/8/6K1 w - - 0 1", key: "pawnShield" })).toBe(0);
	});

	it("does not count pawns on the far side of the board", () => {
		expect(read({ fen: "4k3/8/8/8/8/8/PPP5/6K1 w - - 0 1", key: "pawnShield" })).toBe(0);
	});
});
