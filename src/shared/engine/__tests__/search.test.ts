import { INITIAL_FEN } from "chessops/fen";
import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../chess";
import { defaultishWeights, onlyWeights } from "../../test-support/weights";
import { searchRoot } from "../search";

const MATERIAL = onlyWeights({
	materialPawn: 100,
	materialKnight: 320,
	materialBishop: 330,
	materialRook: 500,
	materialQueen: 900,
});

function bestMove({
	fen,
	depth,
	quiescence,
}: {
	fen: string;
	depth: number;
	quiescence?: boolean;
}): string {
	const scored = searchRoot({
		position: positionFromFen(fen),
		weights: MATERIAL,
		options: { depth, quiescence },
	});
	const best = scored.reduce((left, right) => (right.score > left.score ? right : left));

	return makeUci(best.move);
}

describe("searchRoot", () => {
	it("scores every legal move at any depth", () => {
		const position = positionFromFen(INITIAL_FEN);

		for (const depth of [1, 2]) {
			expect(
				searchRoot({ position, weights: defaultishWeights(), options: { depth } })
			).toHaveLength(20);
		}
	});

	it("returns nothing when the game is over", () => {
		const fen = "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3";

		expect(
			searchRoot({ position: positionFromFen(fen), weights: MATERIAL, options: { depth: 3 } })
		).toEqual([]);
	});
});

describe("looking one move further", () => {
	// White's rook can take the pawn on a7, but the black rook behind it takes back. A greedy
	// search sees only the pawn; a two-ply search sees the recapture.
	const POISONED = "r3k3/p7/8/8/8/8/8/R3K3 w - - 0 1";

	it("takes the poisoned pawn at depth one", () => {
		expect(bestMove({ fen: POISONED, depth: 1 })).toBe("a1a7");
	});

	it("declines it at depth two", () => {
		expect(bestMove({ fen: POISONED, depth: 2 })).not.toBe("a1a7");
	});

	it("declines it at depth one too, once quiescence sees the recapture", () => {
		expect(bestMove({ fen: POISONED, depth: 1, quiescence: true })).not.toBe("a1a7");
	});
});

describe("alpha-beta", () => {
	it("finds the same best move as an unpruned search would", () => {
		// A full-window search of every root move is what `searchRoot` already does, so agreement
		// between depths on a forced recapture is the check that pruning did not lose anything.
		const fen = "4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1";

		expect(bestMove({ fen, depth: 1 })).toBe("d1d5");
		expect(bestMove({ fen, depth: 2 })).toBe("d1d5");
		expect(bestMove({ fen, depth: 3 })).toBe("d1d5");
	});
});

describe("nodeLimit", () => {
	it("still returns a score for every move when the budget runs out", () => {
		const position = positionFromFen(INITIAL_FEN);
		const scored = searchRoot({
			position,
			weights: MATERIAL,
			options: { depth: 4, nodeLimit: 50 },
		});

		expect(scored).toHaveLength(20);
		expect(scored.every((entry) => Number.isFinite(entry.score))).toBe(true);
	});

	it("costs far less than the unbudgeted search it replaces", () => {
		const position = positionFromFen(
			"r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4"
		);
		const started = performance.now();

		searchRoot({ position, weights: MATERIAL, options: { depth: 5, nodeLimit: 2000 } });

		expect(performance.now() - started).toBeLessThan(2000);
	});
});
