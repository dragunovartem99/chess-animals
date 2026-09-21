import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../chess";
import { createRng } from "../../engine";
import { candidates, pickMove } from "../policy";
import { MOVE_COUNT } from "../vocab";

const CASTLE = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
const CASTLE_BLACK = "r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1";
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// Logits that score each listed index, and every other move far below.
function logitsFor(scores: Record<number, number>): Float32Array {
	const logits = new Float32Array(MOVE_COUNT).fill(-50);
	for (const [index, score] of Object.entries(scores)) logits[Number(index)] = score;
	return logits;
}

const indexOf = (fen: string, uci: string) =>
	candidates(positionFromFen(fen)).find(({ move }) => makeUci(move) === uci)?.index;

describe("candidates", () => {
	it("names castling by where the king lands", () => {
		expect(indexOf(CASTLE, "e1h1")).toBe(262);
	});

	it("flips Black's moves onto White's side of the board", () => {
		expect(indexOf(CASTLE_BLACK, "e8h8")).toBe(262);
		// a8a1 for Black is a1a8 on the board Maia sees: from square 0, to square 56.
		expect(indexOf(CASTLE_BLACK, "a8a1")).toBe(56);
	});

	it("lists every legal move once", () => {
		const legal = candidates(positionFromFen(START));

		expect(legal).toHaveLength(20);
		expect(new Set(legal.map(({ index }) => index)).size).toBe(20);
	});
});

describe("pickMove", () => {
	const legal = candidates(positionFromFen(START));
	const e4 = indexOf(START, "e2e4")!;
	const d4 = indexOf(START, "d2d4")!;

	it("takes the likeliest move when greedy", () => {
		const logits = logitsFor({ [e4]: 1, [d4]: 2 });
		const move = pickMove({ candidates: legal, logits, rng: createRng(1), greedy: true });

		expect(makeUci(move!)).toBe("d2d4");
	});

	it("draws from the softmax, the same sequence from the same seed", () => {
		const logits = logitsFor({ [e4]: 0, [d4]: 0 });
		const rng = createRng(7);
		const drawn = Array.from({ length: 6 }, () =>
			makeUci(pickMove({ candidates: legal, logits, rng })!)
		);

		expect(drawn).toEqual(["d2d4", "d2d4", "d2d4", "e2e4", "e2e4", "d2d4"]);
	});

	it("advances the stream by one draw, greedy or not", () => {
		const logits = logitsFor({ [e4]: 1 });
		const greedy = createRng(3);
		const sampled = createRng(3);
		pickMove({ candidates: legal, logits, rng: greedy, greedy: true });
		pickMove({ candidates: legal, logits, rng: sampled });

		expect(greedy.float()).toBe(sampled.float());
	});

	it("has nothing to pick with no legal move", () => {
		expect(
			pickMove({ candidates: [], logits: logitsFor({}), rng: createRng(1) })
		).toBeUndefined();
	});
});
