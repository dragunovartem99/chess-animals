import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { afterMove, legalMoves, positionFromFen } from "@/shared/chess";
import { evaluatePosition } from "@/shared/engine";
import { toUci } from "@/shared/engine/uci/moves";
import { onlyWeights } from "@/shared/test-support/weights";

import { explainPosition } from "../utils/breakdown";

const MATERIAL = onlyWeights({ materialQueen: 900, materialRook: 500, materialPawn: 100 });

describe("explainPosition", () => {
	it("sums to exactly what the search would score the position at", () => {
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

	it("shows the weight after the phase blend, not the one that was authored", () => {
		const weights = {
			opening: onlyWeights({ materialPawn: 100 }).opening,
			middlegame: onlyWeights({ materialPawn: 100 }).middlegame,
			endgame: onlyWeights({ materialPawn: 200 }).endgame,
		};
		const endgame = positionFromFen("4k3/pppppppp/8/8/8/8/PPPPPPPP/4K3 w - - 0 1");
		const [row] = explainPosition({ position: endgame, weights }).rows;

		expect(explainPosition({ position: endgame, weights }).phase).toBe(1);
		expect(row.weight).toBe(200);
	});
});

describe("the move that produced the position", () => {
	const weights = onlyWeights({ givesMate: 100000, materialRook: 500 });

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

		expect(withMove.rows.find((row) => row.key === "givesMate")?.points).toBe(-100000);
		expect(without.rows.find((row) => row.key === "givesMate")?.points).toBe(0);
	});

	it("still sums to what the search would score", () => {
		const parent = positionFromFen("6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1");
		const move = legalMoves(parent).find(
			(candidate) => toUci({ position: parent, move: candidate }) === "a1a8"
		)!;
		const position = afterMove({ position: parent, move });
		const played = { parent, move };

		expect(explainPosition({ position, weights, played }).total).toBeCloseTo(
			evaluatePosition({ position, played, weights }),
			3
		);
	});
});
