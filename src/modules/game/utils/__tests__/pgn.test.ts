import { describe, expect, it } from "vitest";

import { toPgn } from "../pgn";

const TURNS = [
	{ ply: 1, san: "e4", uci: "e2e4" },
	{ ply: 2, san: "e5", uci: "e7e5" },
	{ ply: 3, san: "Nf3", uci: "g1f3" },
];

const score = (status: Parameters<typeof toPgn>[0]["status"]) =>
	toPgn({ turns: [], white: "A", black: "B", status }).trim().split("\n").at(-1);

describe("toPgn", () => {
	it("numbers White's moves and marks an unfinished game", () => {
		const pgn = toPgn({ turns: TURNS, white: "You", black: "Donkey", status: { over: false } });

		expect(pgn).toBe('[White "You"]\n[Black "Donkey"]\n[Result "*"]\n\n1. e4 e5 2. Nf3 *\n');
	});

	it("scores a win for either side and a draw", () => {
		expect(score({ over: true, result: "white", reason: "checkmate" })).toBe("1-0");
		expect(score({ over: true, result: "black", reason: "checkmate" })).toBe("0-1");
		expect(score({ over: true, result: null, reason: "stalemate" })).toBe("1/2-1/2");
	});
});
