import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { gameStatus } from "../outcome";
import { positionFromFen, repetitionKey } from "../position";

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
