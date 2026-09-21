import type { NormalMove } from "chessops/types";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { MOVE_COUNT, moveIndex } from "../vocab";

const move = (uci: string) => parseUci(uci) as NormalMove;

// Indices read off `all_moves_maia3.json` in maia-platform-frontend, the table the formula replaces.
describe("moveIndex", () => {
	it.each([
		["e2e4", 796],
		["e1g1", 262],
		["a7a8q", 4096],
		["b7c8r", 4137],
		["g7f8b", 4310],
		["h7h8n", 4351],
	])("puts %s where Maia's table does", (uci, index) => {
		expect(moveIndex(move(uci))).toBe(index);
	});

	it("ends on the last index of the space", () => {
		expect(moveIndex(move("h7h8n"))).toBe(MOVE_COUNT - 1);
	});
});
