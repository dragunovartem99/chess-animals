import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { afterMove, legalMoves, positionFromFen } from "../../chess";
import { extractFeatures } from "../extract";
import { FEATURES } from "../features";

// A spread wide enough that every feature has somewhere to fire: a middlegame, a broken pawn
// structure, an exposed king, a promotion, a mate in one, and a position where castling is legal.
const CORPUS = [
	INITIAL_FEN,
	"r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
	"4k3/8/8/4p3/1P1p4/8/2P5/4K3 w - - 0 1",
	"6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
	"7k/3P4/8/8/8/8/8/4K3 w - - 0 1",
	"6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1",
	"4k3/8/8/3N4/2P5/8/8/4K3 w - - 0 1",
	"8/8/3k4/8/3K4/8/8/8 w - - 0 1",
	"r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1",
	"4k3/8/8/8/8/8/8/2B1KB2 w - - 0 1",
	"4k3/8/8/8/P7/P7/8/4K3 w - - 0 1",
];

function everyVectorInCorpus(): number[][] {
	const vectors: number[][] = [];

	for (const fen of CORPUS) {
		const position = positionFromFen(fen);
		vectors.push([...extractFeatures({ position })]);

		for (const move of legalMoves(position)) {
			const played = { parent: position, move };
			vectors.push([...extractFeatures({ position: afterMove({ position, move }), played })]);
		}
	}

	return vectors;
}

describe("the feature registry", () => {
	// Guards against the failure this test was written for: a family quietly dropped from the
	// extractor still leaves its features in the registry, and every position then reads zero for
	// them — a bot silently loses a whole part of its personality with nothing to show for it.
	it("has no feature that never fires anywhere in the corpus", () => {
		const vectors = everyVectorInCorpus();
		const dead = FEATURES.filter((feature) =>
			vectors.every((vector) => vector[feature.id] === 0)
		);

		expect(dead.map((feature) => feature.key)).toEqual([]);
	});
});
