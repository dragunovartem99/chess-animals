import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { legalMoves } from "../../chess";
import { toUci } from "../../engine/uci/moves";
import { useGame } from "../useGame";

function move({ game, uci }: { game: ReturnType<typeof useGame>; uci: string }) {
	const found = legalMoves(game.position.value).find(
		(candidate) => toUci({ position: game.position.value, move: candidate }) === uci
	);

	game.play(found!);
}

describe("useGame", () => {
	it("starts on the opening position with no history", () => {
		const game = useGame();

		expect(game.fen.value).toBe(INITIAL_FEN);
		expect(game.turns.value).toEqual([]);
		expect(game.status.value.over).toBe(false);
	});

	it("records a move in algebraic notation", () => {
		const game = useGame();
		move({ game, uci: "e2e4" });

		expect(game.turns.value).toEqual([{ ply: 1, san: "e4", uci: "e2e4" }]);
		expect(game.lastMove.value).toEqual(["e2", "e4"]);
	});

	it("names the piece from the position the move came from", () => {
		const game = useGame();
		move({ game, uci: "g1f3" });

		expect(game.turns.value[0].san).toBe("Nf3");
	});

	it("counts plies, which is what tells two identical positions apart", () => {
		const game = useGame();
		for (const uci of ["g1f3", "g8f6", "f3g1", "f6g8"]) move({ game, uci });

		expect(game.ply.value).toBe(4);
		expect(game.fen.value).not.toBe(INITIAL_FEN);
	});

	it("draws by repetition, which needs the history the position does not carry", () => {
		const game = useGame();
		for (const uci of ["g1f3", "g8f6", "f3g1", "f6g8", "g1f3", "g8f6", "f3g1", "f6g8"]) {
			move({ game, uci });
		}

		expect(game.status.value).toMatchObject({ over: true, reason: "repetition" });
	});

	it("refuses to play on once the game is over", () => {
		const game = useGame({ plyLimit: 2 });
		move({ game, uci: "e2e4" });
		move({ game, uci: "e7e5" });

		expect(game.status.value.over).toBe(true);
		move({ game, uci: "g1f3" });
		expect(game.ply.value).toBe(2);
	});

	it("clears the history on reset, not just the board", () => {
		const game = useGame();
		move({ game, uci: "e2e4" });
		game.reset();

		expect(game.fen.value).toBe(INITIAL_FEN);
		expect(game.turns.value).toEqual([]);
		expect(game.lastMove.value).toBeUndefined();
		expect(game.status.value.over).toBe(false);
	});
});
