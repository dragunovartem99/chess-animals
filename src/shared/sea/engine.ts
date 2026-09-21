import { INITIAL_FEN } from "chessops/fen";

import type { BotConfig } from "../bots";
import { positionFromFen } from "../chess";
import { createRng, createUciEngine } from "../engine";
import type { GoSearch, Rng, UciCommand, UciResponse } from "../engine";
import { fromUci, toUci } from "../engine/uci/moves";
import { replay } from "../engine/uciMoves";
import type { Replayed } from "../engine/uciMoves";
import { applySeaOption, describeSeaOptions } from "./options";
import type { Stockfish } from "./stockfish";

export type SeaEngineState = {
	config: BotConfig;
	name: string;
	stockfish: Stockfish;
	goSearch: GoSearch;
};

const NULL_MOVE: UciResponse[] = [{ type: "bestmove", move: "0000" }];

// One sea animal: Stockfish, diluted. On each move a roll decides who plays it — the animal's own
// search, the land engine underneath, for `mix` percent of them, and Stockfish for the rest.
// Diluting with the animal rather than with a random move is the point: a strong opponent that
// now and then plays what it believes in, which is a thing to learn and to lean on.
//
// It speaks UCI like the land engine and is one, mostly: everything but `go` and its two options
// is the land engine's, and the roll is drawn from a stream of its own so a game replays from its
// seed. An answer is a promise, because Stockfish is a process to ask, not a function to call.
export function createSeaEngine({ config, name, stockfish, goSearch }: SeaEngineState) {
	const land = createUciEngine({ config, name, goSearch });
	let current = config;
	let seed: number | string = config.id;
	let rng: Rng = createRng(seed);
	let game: Replayed = { position: positionFromFen(INITIAL_FEN), fen: INITIAL_FEN, moves: [] };

	// Stockfish starts on the first command that needs it, not when the animal is made: a roster
	// view that never plays one never pays for it.
	const start = () => stockfish.init();

	async function go(command: Extract<UciCommand, { type: "go" }>): Promise<UciResponse[]> {
		const options = current.stockfish;
		if (!options) throw new Error(`"${current.id}" is not a sea animal`);

		// Drawn on every move, even at a mix of zero: the stream must not depend on who played.
		if (rng.float() * 100 < options.mix) return land.handle(command);

		await start();
		const { position, fen, moves } = game;
		const nodes = command.limits.nodes ?? options.nodes;
		const uci = await stockfish.bestMove({ fen, moves, nodes });
		const move = uci && fromUci({ position, uci });

		return move ? [{ type: "bestmove", move: toUci({ position, move }) }] : NULL_MOVE;
	}

	return {
		async handle(command: UciCommand): Promise<UciResponse[]> {
			switch (command.type) {
				case "uci":
					return land.handle(command).toSpliced(-1, 0, ...describeSeaOptions(current));
				case "isready":
					await start();
					return land.handle(command);
				case "ucinewgame":
					rng = createRng(seed);
					game = { position: positionFromFen(INITIAL_FEN), fen: INITIAL_FEN, moves: [] };
					await start();
					await stockfish.newGame();
					return land.handle(command);
				case "setoption": {
					const next = applySeaOption({ config: current, ...command });
					if (next) {
						current = next;
						return [];
					}
					if (command.name === "Seed" && command.value !== undefined) {
						seed = command.value;
						rng = createRng(seed);
					}

					return land.handle(command);
				}
				case "position":
					game = replay(command);
					return land.handle(command);
				case "go":
					return go(command);
				default:
					return [];
			}
		},
	};
}
