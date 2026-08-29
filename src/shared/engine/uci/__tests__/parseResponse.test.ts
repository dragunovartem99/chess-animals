import { describe, expect, it } from "vitest";

import { parseResponse } from "../parseResponse";

describe("parseResponse", () => {
	it("takes the fields it knows out of an info line and ignores the rest", () => {
		const response = parseResponse(
			"info depth 5 seldepth 7 multipv 1 score cp 24 nodes 1200 nps 60000 pv e2e4"
		);

		expect(response).toEqual({
			type: "info",
			depth: 5,
			nodes: 1200,
			score: { kind: "cp", value: 24 },
			pv: ["e2e4"],
		});
	});

	it("reads a mate score", () => {
		expect(parseResponse("info score mate -2")).toMatchObject({
			score: { kind: "mate", moves: -2 },
		});
	});

	it("refuses a bestmove with no move", () => {
		expect(parseResponse("bestmove")).toEqual({ type: "unknown", line: "bestmove" });
	});
});
