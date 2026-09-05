import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { afterMove, positionFromFen } from "../position";
import { createRepetition } from "../repetition";

// A queen up, both kings free to shuffle, and a clock already well past the four half-moves a
// repetition needs.
const QUIET = "6k1/8/8/8/8/8/8/1Q4K1 w - - 10 40";

// Pushes each position before playing its move, the way a game does, and returns where it ended.
function walk({ fen, moves }: { fen: string; moves: readonly string[] }) {
	const repetition = createRepetition();
	let position = positionFromFen(fen);

	for (const uci of moves) {
		repetition.push(position);
		position = afterMove({ position, move: parseUci(uci)! });
	}

	return { position, repetition };
}

describe("createRepetition", () => {
	it("finds a position four plies back", () => {
		const { position, repetition } = walk({
			fen: QUIET,
			moves: ["g1h1", "g8h8", "h1g1", "h8g8"],
		});

		expect(repetition.repeats(position)).toBe(true);
	});

	it("does not call a position it has never held a repetition", () => {
		const { position, repetition } = walk({ fen: QUIET, moves: ["g1h1", "g8h8"] });

		expect(repetition.repeats(position)).toBe(false);
	});

	it("tells two positions apart by whose move it is", () => {
		const start = positionFromFen(QUIET);
		const repetition = createRepetition();
		repetition.push(start);

		// The same board, the other side to move, and so not the same position.
		expect(repetition.repeats(positionFromFen(QUIET.replace(" w ", " b ")))).toBe(false);
	});

	it("looks back no further than the clock says is reachable", () => {
		const { repetition } = walk({ fen: QUIET, moves: ["g1h1", "g8h8", "h1g1", "h8g8"] });

		// The same board as the start, which the stack does hold — but a clock claiming a capture
		// two plies ago, which puts the start out of reach.
		const reset = positionFromFen(QUIET.replace(" 10 40", " 2 40"));

		expect(repetition.repeats(reset)).toBe(false);
	});

	it("forgets a position once it is popped", () => {
		const { position, repetition } = walk({
			fen: QUIET,
			moves: ["g1h1", "g8h8", "h1g1", "h8g8"],
		});

		repetition.pop();
		repetition.pop();

		expect(repetition.repeats(position)).toBe(false);
	});

	it("grows past its initial capacity", () => {
		const repetition = createRepetition();
		const start = positionFromFen(QUIET);

		for (let count = 0; count < 2000; count += 1) repetition.push(start);

		expect(repetition.repeats(start)).toBe(true);
	});
});
