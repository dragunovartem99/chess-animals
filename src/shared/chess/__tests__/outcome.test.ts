import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { createDrawTest, gameStatus } from "../outcome";
import { positionFromFen, repetitionKey } from "../position";
import { createRepetition } from "../repetition";

describe("gameStatus", () => {
	it("reports an opening position as unfinished", () => {
		expect(gameStatus({ position: positionFromFen(INITIAL_FEN) })).toEqual({ over: false });
	});

	it("awards the point to the side that delivered mate", () => {
		const fen = "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3";

		expect(gameStatus({ position: positionFromFen(fen) })).toEqual({
			over: true,
			result: "black",
			reason: "checkmate",
		});
	});

	it("draws a stalemate", () => {
		const status = gameStatus({ position: positionFromFen("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1") });

		expect(status).toEqual({ over: true, result: null, reason: "stalemate" });
	});

	it("draws bare kings as insufficient material", () => {
		const status = gameStatus({ position: positionFromFen("4k3/8/8/8/8/8/8/4K3 w - - 0 1") });

		expect(status).toEqual({ over: true, result: null, reason: "insufficient-material" });
	});
});

describe("gameStatus adjudication", () => {
	it("draws on the third occurrence, counting the position on the board", () => {
		const position = positionFromFen("4k3/8/8/8/8/8/4P3/4K3 w - - 0 1");
		const key = repetitionKey(position);

		expect(gameStatus({ position, keys: [key, key] })).toEqual({
			over: true,
			result: null,
			reason: "repetition",
		});
		expect(gameStatus({ position, keys: [key] })).toEqual({ over: false });
	});

	it("draws after a hundred half-moves without a capture or pawn move", () => {
		const status = gameStatus({
			position: positionFromFen("4k3/8/8/8/8/8/4P3/4K3 w - - 100 60"),
		});

		expect(status).toEqual({ over: true, result: null, reason: "fifty-move" });
	});

	it("adjudicates a draw once the ply cap is reached", () => {
		const position = positionFromFen(INITIAL_FEN);

		expect(gameStatus({ position, plyLimit: 200, ply: 200 })).toEqual({
			over: true,
			result: null,
			reason: "ply-limit",
		});
		expect(gameStatus({ position, plyLimit: 200, ply: 199 })).toEqual({ over: false });
	});
});

describe("createDrawTest", () => {
	const drawn = createDrawTest(createRepetition());

	it("calls a hundred half-moves without a capture or a pawn a draw", () => {
		const position = positionFromFen("6k1/8/8/8/8/8/8/1Q4K1 w - - 100 80");

		expect(drawn(position)).toBe(true);
	});

	it("calls mate on the hundredth half-move mate, not a draw", () => {
		const position = positionFromFen(
			"rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 100 3"
		);

		expect(drawn(position)).toBe(false);
	});

	it("calls two bare kings a draw", () => {
		const position = positionFromFen("4k3/8/8/8/8/8/8/4K3 w - - 0 1");

		expect(drawn(position)).toBe(true);
	});

	it("does not call a full board a draw", () => {
		expect(drawn(positionFromFen(INITIAL_FEN))).toBe(false);
	});

	it("calls a position the line has already stood in a draw", () => {
		const position = positionFromFen("6k1/8/8/8/8/8/8/1Q4K1 w - - 10 40");
		const repetition = createRepetition();

		for (let ply = 0; ply < 4; ply += 1) repetition.push(position);

		expect(createDrawTest(repetition)(position)).toBe(true);
	});
});
