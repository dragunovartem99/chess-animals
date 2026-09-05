import { INITIAL_FEN } from "chessops/fen";
import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../chess";
import { MATE_SCORE } from "../../eval";
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

describe("quiescence in check", () => {
	// Ra8+ is a back-rank check the black king cannot walk out of: every escape square on the
	// rank is the rook's, so the queen has to interpose and is taken. A quiescence that lets the
	// checked side stand pat never sees that — it prices the position as if Black could decline —
	// and White plays a shuffling rook move instead of winning a queen for a rook.
	const BACK_RANK = "6k1/5ppp/3q4/8/8/8/5PPP/R5K1 w - - 0 1";

	it("searches every evasion, not only the capturing ones", () => {
		expect(bestMove({ fen: BACK_RANK, depth: 1, quiescence: true })).toBe("a1a8");
	});

	it("still recognises a check with no evasion at all as mate", () => {
		// The same rook, with the queen gone: Ra8 is mate. There is no evasion to search and
		// nothing to stand pat on, so the leaf falls through to the evaluation, which is what
		// scores a finished game.
		const position = positionFromFen("6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1");
		const scored = searchRoot({
			position,
			weights: onlyWeights({ materialPawn: 100, givesMate: 1 }),
			options: { depth: 1, quiescence: true },
		});
		const best = scored.reduce((left, right) => (right.score > left.score ? right : left));

		expect(makeUci(best.move)).toBe("a1a8");
		expect(best.score).toBeGreaterThan(MATE_SCORE - 10);
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

function topScore(scored: readonly { score: number }[]): number {
	return Math.max(...scored.map((entry) => entry.score));
}

// The indices of the moves sharing the top score, which is what an argmax with a seeded
// tie-break actually picks from.
function atTop(scored: readonly { score: number }[]): number[] {
	const top = topScore(scored);

	return scored.flatMap((entry, index) => (entry.score >= top - 1e-6 ? [index] : []));
}

describe("root pruning", () => {
	// The pruned search may leave a worse move as a bound, but the best move's score and every
	// genuine tie for it must survive — that is what the argmax and its seeded tie-break stand on.
	const FENS = [
		INITIAL_FEN,
		"r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
		"4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1",
		"r3k3/p7/8/8/8/8/8/R3K3 w - - 0 1",
	];

	for (const fen of FENS) {
		it(`agrees with the full-window search on the best score from ${fen}`, () => {
			const position = positionFromFen(fen);
			const options = { depth: 3 };

			const full = searchRoot({ position, weights: MATERIAL, options });
			const pruned = searchRoot({ position, weights: MATERIAL, options, prune: true });

			expect(topScore(pruned)).toBeCloseTo(topScore(full), 5);

			// The pruned search reports moves in generated order, same as the full one.
			expect(pruned.map((entry) => makeUci(entry.move))).toEqual(
				full.map((entry) => makeUci(entry.move))
			);

			// The moves reading the top score have to be the same ones, both ways round: every
			// genuine tie kept, and — the half that used to be missing — no worse move reported
			// at the top. A cutoff returns a bound rather than a score, and a bound landing on
			// the window reads as an exact tie; the tie-break cannot tell the two apart, so the
			// bot plays a move it scored hundreds of points lower.
			expect(atTop(pruned)).toEqual(atTop(full));
		});
	}
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
