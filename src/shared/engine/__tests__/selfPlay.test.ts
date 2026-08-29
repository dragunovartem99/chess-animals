import { INITIAL_FEN } from "chessops/fen";
import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { afterMove, gameStatus, legalMoves, positionFromFen, repetitionKey } from "../../chess";
import { defaultishWeights } from "../../test-support/weights";
import { chooseMove } from "../policy";
import { createRng } from "../rng";

describe("a bot playing itself", () => {
	it("plays a legal game through to a finish", () => {
		const weights = defaultishWeights({ givesMate: 100000 });
		const rng = createRng("self-play");

		let position = positionFromFen(INITIAL_FEN);
		const keys: string[] = [];
		let ply = 0;

		while (!gameStatus({ position, keys, plyLimit: 300, ply }).over) {
			const move = chooseMove({ position, weights, temperature: 30, rng });
			expect(move).toBeDefined();
			expect(legalMoves(position).some((legal) => makeUci(legal) === makeUci(move!))).toBe(
				true
			);

			keys.push(repetitionKey(position));
			position = afterMove({ position, move: move! });
			ply += 1;
		}

		const status = gameStatus({ position, keys, plyLimit: 300, ply });
		expect(status.over).toBe(true);
		expect(ply).toBeGreaterThan(10);
	});
});
