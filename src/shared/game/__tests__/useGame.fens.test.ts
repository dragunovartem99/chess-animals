import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { legalMoves } from "../../chess";
import { toUci } from "../../engine/uci/moves";
import { useGame } from "../useGame";

describe("useGame, positions", () => {
	it("keeps the position after every ply, and forgets them on reset", () => {
		const game = useGame();
		const e4 = legalMoves(game.position.value).find(
			(move) => toUci({ position: game.position.value, move }) === "e2e4"
		);
		game.play(e4!);

		expect(game.fens.value).toEqual([INITIAL_FEN, game.fen.value]);

		game.reset();
		expect(game.fens.value).toEqual([INITIAL_FEN]);
	});
});
