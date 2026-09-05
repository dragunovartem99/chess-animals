import { makeUci, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { afterMove, createRepetition, positionFromFen } from "../../chess";
import { onlyWeights } from "../../test-support/weights";
import { type ScoredMove, searchRoot } from "../search";

const MATERIAL = onlyWeights({ materialPawn: 100, materialQueen: 900 });

// White is a queen up with nothing to take, so every quiet move is worth the same — which makes a
// move worth nothing the only thing a draw could have caused.
const QUEEN_UP = "6k1/8/8/8/8/8/8/1Q4K1 w - - 10 40";

// Kg1-h1 Kg8-h8 Kh1-g1 Kh8-g8, back where it started with both kings having shuffled once.
const SHUFFLE = ["g1h1", "g8h8", "h1g1", "h8g8"];

// Replays a line the way a real game does — every position on the board before its move is
// pushed — and hands back the board and the history behind it.
function played({ fen, moves }: { fen: string; moves: readonly string[] }) {
	const repetition = createRepetition();
	let position = positionFromFen(fen);

	for (const uci of moves) {
		repetition.push(position);
		position = afterMove({ position, move: parseUci(uci)! });
	}

	return { position, repetition };
}

function scoreOf({ scored, uci }: { scored: ScoredMove[]; uci: string }): number {
	return scored.find((entry) => makeUci(entry.move) === uci)!.score;
}

describe("a search that knows the game behind it", () => {
	it("scores a move back into a position the game has already stood in as a draw", () => {
		const { position, repetition } = played({ fen: QUEEN_UP, moves: SHUFFLE });

		const { scored } = searchRoot({
			position,
			weights: MATERIAL,
			options: { depth: 1 },
			repetition,
		});

		// Negating a zero at the root gives back a negative one, which is the same score.
		expect(scoreOf({ scored, uci: "g1h1" })).toBeCloseTo(0);
		// The same king, one square the other way, has never been seen and is still a queen up.
		expect(scoreOf({ scored, uci: "g1f1" })).toBe(900);
	});

	it("plays the queen up rather than repeat", () => {
		const { position, repetition } = played({ fen: QUEEN_UP, moves: SHUFFLE });

		const { scored } = searchRoot({
			position,
			weights: MATERIAL,
			options: { depth: 1 },
			repetition,
		});
		const best = scored.reduce((left, right) => (right.score > left.score ? right : left));

		expect(best.score).toBe(900);
	});

	it("scores the repetition as a queen's worth of relief for the side that is losing it", () => {
		const { position, repetition } = played({
			// The same shuffle from Black's side of it: a queen down, the repetition is the best
			// thing on the board.
			fen: QUEEN_UP,
			moves: SHUFFLE.slice(0, 1),
		});

		const { scored } = searchRoot({
			position,
			weights: MATERIAL,
			options: { depth: 1 },
			repetition,
		});

		// Nothing repeats yet, so Black is simply a queen down whatever it plays.
		expect(Math.max(...scored.map((entry) => entry.score))).toBe(-900);
	});

	it("does not see a repetition a caller gave it no history for", () => {
		const { position } = played({ fen: QUEEN_UP, moves: SHUFFLE });

		const { scored } = searchRoot({ position, weights: MATERIAL, options: { depth: 1 } });

		expect(scoreOf({ scored, uci: "g1h1" })).toBe(900);
	});
});
