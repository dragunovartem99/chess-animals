import type { Chess } from "chessops/chess";
import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../chess";
import { MATE_SCORE, terminalTerm } from "../terminal";
import { type WeightVector, weightsFromRecord } from "../vector";

// Black is mated: White's rook on a8, the king boxed in by its own pawns.
const MATED = "R5k1/5ppp/8/8/8/8/8/6K1 b - - 0 1";
// Black is stalemated: no legal move, and not in check.
const STALEMATED = "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1";
const QUIET = "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1";

const weights = (record: Record<string, number>) => weightsFromRecord(record);

// The term times its weight: what the breakdown's one row reads.
function score({ position, weights: vector }: { position: Chess; weights: WeightVector }) {
	const term = terminalTerm({ position, weights: vector });
	return term && term.value * vector[term.id];
}

describe("terminalTerm", () => {
	it("is nothing at all in a position the game has not ended in", () => {
		expect(
			score({ position: positionFromFen(QUIET), weights: weights({ givesMate: 1 }) })
		).toBeUndefined();
	});

	// The paper's `random_move` is every weight at zero, and it must keep scoring a finished game
	// the way it scores any other — hence `undefined` rather than a zero that would swallow the
	// rest of the evaluation.
	it("is nothing to a bot that cannot see mate, so the position evaluates normally", () => {
		expect(
			score({ position: positionFromFen(MATED), weights: weights({ givesMate: 0 }) })
		).toBeUndefined();
	});

	it("is the whole score to the mated side, negative from its own perspective", () => {
		expect(
			score({ position: positionFromFen(MATED), weights: weights({ givesMate: 1 }) })
		).toBe(-MATE_SCORE);
	});

	// The pacifist's mirror: a bot that would rather be mated than mate reads the same position
	// with the sign flipped, and needs no player class of its own to do it.
	it("flips with the preference", () => {
		expect(
			score({ position: positionFromFen(MATED), weights: weights({ givesMate: -1 }) })
		).toBe(MATE_SCORE);
	});

	it("is nothing in a stalemate, which evaluates like any other position", () => {
		expect(
			score({
				position: positionFromFen(STALEMATED),
				weights: weights({ givesMate: 1 }),
			})
		).toBeUndefined();
	});
});
