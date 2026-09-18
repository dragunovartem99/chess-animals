import type { NormalMove } from "chessops/types";
import { makeUci, parseSquare } from "chessops/util";
import { describe, expect, it } from "vitest";

import { legalMoves, positionFromFen } from "../../chess";
import { createCutoffs, quietPriority, recordCutoff } from "../cutoffs";
import { orderMoves } from "../ordering";

const move = (from: string, to: string): NormalMove => ({
	from: parseSquare(from)!,
	to: parseSquare(to)!,
});

const G1F3 = move("g1", "f3");
const B1C3 = move("b1", "c3");
const E2E4 = move("e2", "e4");

describe("quietPriority", () => {
	it("ranks every quiet move level before anything has cut off", () => {
		const cutoffs = createCutoffs();

		expect(quietPriority({ cutoffs, move: G1F3, ply: 2 })).toBe(0);
	});

	it("puts the latest killer first and keeps the one before it second", () => {
		const cutoffs = createCutoffs();
		recordCutoff({ cutoffs, move: G1F3, ply: 2, depth: 1 });
		recordCutoff({ cutoffs, move: B1C3, ply: 2, depth: 1 });

		expect(quietPriority({ cutoffs, move: B1C3, ply: 2 })).toBe(51);
		expect(quietPriority({ cutoffs, move: G1F3, ply: 2 })).toBe(50);
	});

	it("does not let one move fill both killer slots", () => {
		const cutoffs = createCutoffs();
		recordCutoff({ cutoffs, move: G1F3, ply: 2, depth: 1 });
		recordCutoff({ cutoffs, move: B1C3, ply: 2, depth: 1 });
		recordCutoff({ cutoffs, move: B1C3, ply: 2, depth: 1 });

		expect(quietPriority({ cutoffs, move: G1F3, ply: 2 })).toBe(50);
	});

	it("keeps killers to their own ply and falls back on history elsewhere", () => {
		const cutoffs = createCutoffs();
		recordCutoff({ cutoffs, move: G1F3, ply: 2, depth: 2 });

		const elsewhere = quietPriority({ cutoffs, move: G1F3, ply: 3 });
		expect(elsewhere).toBeGreaterThan(0);
		expect(elsewhere).toBeLessThan(50);
	});

	it("ranks a move that cut off deeper in the tree above a shallow one", () => {
		const cutoffs = createCutoffs();
		recordCutoff({ cutoffs, move: G1F3, ply: 1, depth: 3 });
		recordCutoff({ cutoffs, move: E2E4, ply: 1, depth: 1 });

		// Read at a ply with no killers, so this is history alone.
		expect(quietPriority({ cutoffs, move: G1F3, ply: 5 })).toBeGreaterThan(
			quietPriority({ cutoffs, move: E2E4, ply: 5 })
		);
	});
});

describe("orderMoves with cutoffs", () => {
	// White can take on d5 with the e-pawn; everything else is quiet.
	const position = positionFromFen(
		"rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2"
	);

	it("tries a killer after the captures and before every other quiet move", () => {
		const cutoffs = createCutoffs();
		recordCutoff({ cutoffs, move: G1F3, ply: 4, depth: 1 });

		const order = orderMoves({ position, moves: legalMoves(position), cutoffs, ply: 4 });

		expect(order.slice(0, 2).map((entry) => makeUci(entry))).toEqual(["e4d5", "g1f3"]);
	});

	it("leaves the quiet moves in generated order without them", () => {
		const generated = legalMoves(position).filter((entry) => makeUci(entry) !== "e4d5");
		const order = orderMoves({ position, moves: legalMoves(position) });

		expect(order.slice(1)).toEqual(generated);
	});
});
