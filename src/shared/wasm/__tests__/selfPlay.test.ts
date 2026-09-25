import { INITIAL_FEN } from "chessops/fen";
import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { afterMove, gameStatus, legalMoves, positionFromFen, repetitionKey } from "../../chess";
import { seedState } from "../../engine";
import { goSearch } from "../../test-support/wasm";
import { playerWeights } from "../../test-support/weights";

const GREEDY = { depth: 1 };

describe("a bot playing itself", () => {
	it("plays a legal game through to a finish", () => {
		const weights = playerWeights();
		let rngState = seedState("self-play");

		let position = positionFromFen(INITIAL_FEN);
		const moves: string[] = [];
		const keys: string[] = [];
		let ply = 0;

		while (!gameStatus({ position, keys, plyLimit: 300, ply }).over) {
			const game = { position, fen: INITIAL_FEN, moves };
			const found = goSearch({ game, weights, search: GREEDY, rngState });
			const { move } = found;
			rngState = found.rngState;
			expect(move).toBeDefined();
			expect(legalMoves(position).some((legal) => makeUci(legal) === makeUci(move!))).toBe(
				true
			);

			keys.push(repetitionKey(position));
			moves.push(makeUci(move!));
			position = afterMove({ position, move: move! });
			ply += 1;
		}

		const status = gameStatus({ position, keys, plyLimit: 300, ply });
		expect(status.over).toBe(true);
		expect(ply).toBeGreaterThan(10);
	});
});
