import { describe, expect, it } from "vitest";

import { afterMove, legalMoves, positionFromFen } from "../../chess";
import { toUci } from "../../engine/uci/moves";
import { explain } from "../../test-support/explain";
import { onlyWeights } from "../../test-support/weights";
import { MATE_SCORE } from "../terminal";

describe("the move that produced the position", () => {
	const weights = onlyWeights({ givesMate: 1, materialRook: 500 });

	it("shows the mate, rather than scoring a mated position as merely quiet", () => {
		// Ra1-a8 is checkmate. Without the move, every move-level feature reads zero and the panel
		// explains a finished game as an ordinary position — which is what made it confusing.
		const parent = positionFromFen("6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1");
		const move = legalMoves(parent).find(
			(candidate) => toUci({ position: parent, move: candidate }) === "a1a8"
		)!;
		const position = afterMove({ position: parent, move });

		const withMove = explain({ position, weights, played: { parent, move } });
		const without = explain({ position, weights });

		// White delivered the mate, so White-relative it is a large positive — and it is the
		// only row, because a mate replaces the evaluation instead of joining it.
		expect(withMove.rows.map((row) => row.key)).toEqual(["givesMate"]);
		expect(withMove.rows[0].points).toBe(MATE_SCORE);

		// The mate is a property of the position, not of the move that produced it, so the panel
		// still reports it when it was not told which move was played.
		expect(without.rows.map((row) => row.key)).toEqual(["givesMate"]);
	});
});

// The mate rule itself is the engine's, tested in `evaluate_test.c`; these are the panel's reading
// of it, which must leave every position the engine would evaluate normally to the rows.
describe("a game-ending position", () => {
	const MATED = "R5k1/5ppp/8/8/8/8/8/6K1 b - - 0 1";
	const STALEMATED = "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1";

	it("flips with the preference", () => {
		const weights = onlyWeights({ givesMate: -1 });

		expect(explain({ position: positionFromFen(MATED), weights }).total).toBe(-MATE_SCORE);
	});

	// The paper's `random_move` is every weight at zero: it must keep scoring a finished game the
	// way it scores any other, not as a lone zero row that swallows the rest of the evaluation.
	it("is scored like any other position by a bot that cannot see mate", () => {
		const weights = onlyWeights({ givesMate: 0, materialRook: 500 });
		const { rows } = explain({ position: positionFromFen(MATED), weights });

		expect(rows.map((row) => row.key)).toEqual(["materialRook"]);
	});

	it("is nothing special in a stalemate", () => {
		const weights = onlyWeights({ givesMate: 1, materialQueen: 900 });

		expect(explain({ position: positionFromFen(STALEMATED), weights }).total).toBe(900);
	});
});
