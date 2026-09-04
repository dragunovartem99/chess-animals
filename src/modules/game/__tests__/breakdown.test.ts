import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { afterMove, legalMoves, positionFromFen } from "@/shared/chess";
import { evaluatePosition } from "@/shared/engine";
import { toUci } from "@/shared/engine/uci/moves";
import { MATE_SCORE } from "@/shared/eval";
import { onlyWeights } from "@/shared/test-support/weights";

import { explainPosition } from "../utils/breakdown";

const MATERIAL = onlyWeights({ materialQueen: 900, materialRook: 500, materialPawn: 100 });

describe("explainPosition", () => {
	it("sums to what the search would score the position at, for White", () => {
		for (const fen of [
			INITIAL_FEN,
			"4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1",
			"8/5pk1/6p1/8/8/6P1/5PK1/8 w - - 0 40",
		]) {
			const position = positionFromFen(fen);

			expect(explainPosition({ position, weights: MATERIAL }).total).toBeCloseTo(
				evaluatePosition({ position, weights: MATERIAL }),
				3
			);
		}
	});

	it("leaves out features the bot has switched off", () => {
		const rows = explainPosition({
			position: positionFromFen(INITIAL_FEN),
			weights: MATERIAL,
		}).rows;

		expect(rows.map((row) => row.key).toSorted()).toEqual([
			"materialPawn",
			"materialQueen",
			"materialRook",
		]);
	});

	it("puts the term that matters most first", () => {
		const position = positionFromFen("4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1");
		const [first] = explainPosition({ position, weights: MATERIAL }).rows;

		expect(first.key).toBe("materialQueen");
		expect(first.points).toBe(-900);
	});
});

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

		const withMove = explainPosition({ position, weights, played: { parent, move } });
		const without = explainPosition({ position, weights });

		// White delivered the mate, so White-relative it is a large positive — and it is the
		// only row, because a mate replaces the evaluation instead of joining it.
		expect(withMove.rows.map((row) => row.key)).toEqual(["givesMate"]);
		expect(withMove.rows[0].points).toBe(MATE_SCORE);

		// The mate is a property of the position, not of the move that produced it, so the panel
		// still reports it when it was not told which move was played.
		expect(without.rows.map((row) => row.key)).toEqual(["givesMate"]);
	});

	it("still sums to what the search would score", () => {
		const parent = positionFromFen("6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1");
		const move = legalMoves(parent).find(
			(candidate) => toUci({ position: parent, move: candidate }) === "a1a8"
		)!;
		const position = afterMove({ position: parent, move });
		const played = { parent, move };

		// `evaluatePosition` scores from the side to move — Black, who has just been mated — so the
		// White-relative total the panel shows is its negation.
		expect(explainPosition({ position, weights, played }).total).toBeCloseTo(
			-evaluatePosition({ position, played, weights }),
			3
		);
	});
});

describe("the sign convention", () => {
	// The one thing the panel must never do is report the same position differently depending on
	// whose turn it happens to be.
	const board = "4k3/8/8/3q4/8/8/8/3RK3";

	it("reads the same for a position whoever is to move", () => {
		const white = explainPosition({
			position: positionFromFen(`${board} w - - 0 1`),
			weights: MATERIAL,
		});
		const black = explainPosition({
			position: positionFromFen(`${board} b - - 0 1`),
			weights: MATERIAL,
		});

		expect(black.total).toBeCloseTo(white.total, 3);
	});

	it("is negative when Black is the one who is better", () => {
		// Black is a queen up for a rook.
		expect(
			explainPosition({ position: positionFromFen(`${board} w - - 0 1`), weights: MATERIAL })
				.total
		).toBeLessThan(0);
	});

	it("is positive when White is better", () => {
		const position = positionFromFen("3qk3/8/8/8/8/8/8/3RK3 b - - 0 1");

		expect(
			explainPosition({ position, weights: onlyWeights({ materialRook: 500 }) }).total
		).toBe(500);
	});

	it("flips the feature readings too, so value times weight still gives points", () => {
		const position = positionFromFen(`${board} b - - 0 1`);
		const [row] = explainPosition({ position, weights: MATERIAL }).rows;

		expect(row.value * row.weight).toBeCloseTo(row.points, 3);
	});
});
