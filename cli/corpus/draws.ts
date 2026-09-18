import { Chess } from "chessops/chess";
import { makeUci } from "chessops/util";

import { createDrawTest, createRepetition, legalMoves } from "@/shared/chess";
import { createRng } from "@/shared/engine";

// The C draw test is checked against `createDrawTest` on `draws.txt`: each line is one game from
// the start position as its moves, then one flag per position after each move — whether the
// search would score it a draw, with the game so far as its history, pushed and played the way
// `runGame` does. Long random games, because a random mover shuffles into repetitions, trades
// down to bare kings and runs the fifty-move clock out, which is every rule the test knows.
const GAMES = 150;
const MAX_PLIES = 300;

export function drawLines(): string[] {
	const rng = createRng("engine-draws");
	const lines: string[] = [];

	for (let game = 0; game < GAMES; game += 1) {
		const position = Chess.default();
		const repetition = createRepetition();
		const drawn = createDrawTest(repetition);
		const moves: string[] = [];
		let flags = "";

		for (let ply = 0; ply < MAX_PLIES && !position.isEnd(); ply += 1) {
			const move = rng.pick(legalMoves(position));

			repetition.push(position);
			position.play(move);
			moves.push(makeUci(move));
			flags += drawn(position) ? "1" : "0";
		}

		lines.push(`${moves.join(" ")};${flags}`);
	}

	return lines;
}
