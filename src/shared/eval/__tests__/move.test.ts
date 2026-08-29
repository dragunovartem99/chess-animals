import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { afterMove, legalMoves, positionFromFen } from "../../chess";
import { extractFeatures } from "../extract";
import { featureId } from "../features";

function afterUci({ fen, uci, key }: { fen: string; uci: string; key: string }): number {
	const position = positionFromFen(fen);
	const move = legalMoves(position).find((candidate) => makeUci(candidate) === uci);
	if (!move) throw new Error(`${uci} is not legal in ${fen}`);

	const features = extractFeatures({
		position: afterMove({ position, move }),
		played: { parent: position, move },
	});

	return features[featureId(key)];
}

describe("move-level features at the root", () => {
	it("all read zero when no move produced the position", () => {
		const features = extractFeatures({
			position: positionFromFen("4k3/8/8/8/8/8/8/4K2R w K - 0 1"),
		});
		const keys = [
			"givesMate",
			"givesCheck",
			"captureValue",
			"isPromotion",
			"isCastle",
			"movedRook",
		];

		for (const key of keys) expect(features[featureId(key)]).toBe(0);
	});
});

describe("givesCheck", () => {
	it("is negative in the child, so a positive weight makes the mover want it", () => {
		expect(
			afterUci({ fen: "4k3/8/8/8/8/8/8/4K2R w K - 0 1", uci: "h1h2", key: "givesCheck" })
		).toBe(0);
		expect(
			afterUci({ fen: "4k3/8/8/8/8/8/8/R3K3 w Q - 0 1", uci: "a1a8", key: "givesCheck" })
		).toBe(-1);
	});
});

describe("givesMate", () => {
	it("replaces the check it also is, rather than counting twice", () => {
		const mate = { fen: "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1", uci: "a1a8" };

		expect(afterUci({ ...mate, key: "givesMate" })).toBe(-1);
		expect(afterUci({ ...mate, key: "givesCheck" })).toBe(0);
	});
});

describe("captureValue", () => {
	it("prices the piece taken", () => {
		expect(
			afterUci({ fen: "4k3/8/8/8/8/4K3/8/r6R w - - 0 1", uci: "h1a1", key: "captureValue" })
		).toBe(-5);
	});

	it("is zero for a quiet move", () => {
		expect(
			afterUci({ fen: "4k3/8/8/8/8/8/8/4K2R w K - 0 1", uci: "h1h2", key: "captureValue" })
		).toBe(0);
	});

	it("sees the pawn an en passant capture takes from a square the move never names", () => {
		const fen = "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2";

		expect(afterUci({ fen, uci: "e5d6", key: "captureValue" })).toBe(-1);
	});
});

describe("isPromotion", () => {
	it("fires on the promotion, whatever the piece chosen", () => {
		expect(
			afterUci({ fen: "7k/3P4/8/8/8/8/8/4K3 w - - 0 1", uci: "d7d8q", key: "isPromotion" })
		).toBe(-1);
		expect(
			afterUci({ fen: "7k/3P4/8/8/8/8/8/4K3 w - - 0 1", uci: "d7d8n", key: "isPromotion" })
		).toBe(-1);
	});
});

describe("isCastle", () => {
	// chessops names a castling move by the square the *rook* stands on, Chess960 style.
	it("fires on castling but not on an ordinary king move", () => {
		const fen = "4k3/8/8/8/8/8/8/4K2R w K - 0 1";

		expect(afterUci({ fen, uci: "e1h1", key: "isCastle" })).toBe(-1);
		expect(afterUci({ fen, uci: "e1d1", key: "isCastle" })).toBe(0);
	});
});

describe("the moved piece", () => {
	it("names exactly one role", () => {
		const fen = "4k3/8/8/8/8/8/8/4K2R w K - 0 1";

		expect(afterUci({ fen, uci: "h1h2", key: "movedRook" })).toBe(-1);
		expect(afterUci({ fen, uci: "h1h2", key: "movedKing" })).toBe(0);
		expect(afterUci({ fen, uci: "e1d1", key: "movedKing" })).toBe(-1);
	});

	it("credits castling to the king, not the rook", () => {
		expect(
			afterUci({ fen: "4k3/8/8/8/8/8/8/4K2R w K - 0 1", uci: "e1h1", key: "movedKing" })
		).toBe(-1);
	});
});
