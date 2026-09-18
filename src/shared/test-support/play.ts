import { INITIAL_FEN } from "chessops/fen";
import type { Color } from "chessops/types";
import { makeUci } from "chessops/util";

import {
	afterMove,
	createRepetition,
	type GameResult,
	gameStatus,
	positionFromFen,
	repetitionKey,
} from "../chess";
import { type SearchOptions, seedState } from "../engine";
import type { WeightVector } from "../eval";
import { goSearch } from "./wasm";

export type TestBot = { weights: WeightVector; search: SearchOptions };

function points({ result, color }: { result: GameResult; color: Color }): number {
	if (result === null) return 0.5;

	return result === color ? 1 : 0;
}

// A game between two bots, played to a finish or to the ply cap. The real runner lives in the
// scheduler and runs inside a worker; this is the smallest thing a test can assert against.
export function playGame({
	white,
	black,
	fen = INITIAL_FEN,
	plyLimit = 120,
	seed = 1,
}: {
	white: TestBot;
	black: TestBot;
	fen?: string;
	plyLimit?: number;
	seed?: number;
}): GameResult {
	let rngState = seedState(seed);
	let position = positionFromFen(fen);
	const keys: string[] = [];
	const repetition = createRepetition();
	const moves: string[] = [];
	let ply = 0;

	for (;;) {
		const status = gameStatus({ position, keys, plyLimit, ply });
		if (status.over) return status.result;

		const bot = position.turn === "white" ? white : black;
		const game = { position, repetition, fen, moves };
		const found = goSearch({ game, weights: bot.weights, search: bot.search, rngState });
		const { move } = found;
		rngState = found.rngState;
		if (!move) return null;

		keys.push(repetitionKey(position));
		repetition.push(position);
		moves.push(makeUci(move));
		position = afterMove({ position, move });
		ply += 1;
	}
}

// The same pairing played twice with the colors swapped, which is how the arena will run every
// opening: it cancels out whatever the first move is worth, so a difference in the score is a
// difference between the bots.
export function playPair({
	one,
	two,
	fen,
	plyLimit,
	seed,
}: {
	one: TestBot;
	two: TestBot;
	fen?: string;
	plyLimit?: number;
	seed?: number;
}): number {
	const asWhite = playGame({ white: one, black: two, fen, plyLimit, seed });
	const asBlack = playGame({ white: two, black: one, fen, plyLimit, seed });

	return (
		points({ result: asWhite, color: "white" }) + points({ result: asBlack, color: "black" })
	);
}
