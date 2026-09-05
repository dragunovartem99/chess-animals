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
		const keys = ["givesCheck", "captureValue"];

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

	// A mate is also a check, and the extractor no longer asks which: a mated position never
	// reaches extraction, because `terminalTerm` has already scored it.
	it("reads on a mating move too, which only a mate-blind bot ever sees", () => {
		expect(
			afterUci({ fen: "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1", uci: "a1a8", key: "givesCheck" })
		).toBe(-1);
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
