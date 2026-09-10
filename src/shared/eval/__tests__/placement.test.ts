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

describe("development", () => {
	it("is level in the opening, where nothing has moved", () => {
		expect(read({ fen: INITIAL_FEN, key: "development" })).toBe(0);
	});

	it("counts our knights and bishops off the back rank minus theirs", () => {
		// White has a knight and a bishop out (2); Black only one knight (1); Black to move.
		const fen = "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R b KQkq - 0 4";
		expect(read({ fen, key: "development" })).toBe(1 - 2);
	});

	it("ignores rooks, queens, kings and pawns", () => {
		const fen = "4k3/8/8/8/3P4/Q7/8/R3K2R w KQ - 0 1";
		expect(read({ fen, key: "development" })).toBe(0);
	});

	it("flips sign with the side to move", () => {
		const white = "rnbqkbnr/pppp1ppp/8/4p3/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 1 2";
		const black = "rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2";
		expect(read({ fen: white, key: "development" })).toBe(-1);
		expect(read({ fen: black, key: "development" })).toBe(-1);
	});
});

describe("earlyQueen", () => {
	it("is 0 in the opening, where no queen has moved", () => {
		expect(read({ fen: INITIAL_FEN, key: "earlyQueen" })).toBe(0);
	});

	it("counts the minors left at home behind a queen that is already out", () => {
		// Black queen on h4, all four black minors still home; White to move.
		const fen = "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3";
		expect(read({ fen, key: "earlyQueen" })).toBe(-4);
	});

	it("is 0 once the queen is traded off, however undeveloped the minors", () => {
		const fen = "rnb1kbnr/pppp1ppp/8/4p3/8/8/PPPP1PPP/RNB1KBNR w KQkq - 0 3";
		expect(read({ fen, key: "earlyQueen" })).toBe(0);
	});

	it("is 0 once the minors behind the early queen have developed", () => {
		const fen = "r3k2r/ppp2ppp/2npbn2/4p2q/6P1/2NPBN2/PPP2P1P/R2QK2R w KQkq - 0 1";
		expect(read({ fen, key: "earlyQueen" })).toBe(0);
	});
});
