import { INITIAL_FEN } from "chessops/fen";

import type { BotConfig } from "../bots";
import { positionFromFen } from "../chess";
import { createRng, createUciEngine } from "../engine";
import type { GoSearch, Rng, UciCommand, UciResponse } from "../engine";
import { fromUci, toUci } from "../engine/uci/moves";
import { replay } from "../engine/uciMoves";
import type { Replayed } from "../engine/uciMoves";
import { pickLine } from "./lines";
import { applySeaOption, describeSeaOptions } from "./options";
import type { Stockfish } from "./stockfish";

export type SeaEngineState = {
	config: BotConfig;
	name: string;
	stockfish: Stockfish;
	goSearch: GoSearch;
};

const NULL_MOVE: UciResponse[] = [{ type: "bestmove", move: "0000" }];

// One sea animal: Stockfish, softened. Each move it asks Stockfish for its best few lines and
// picks one, the worse a line the less likely — see `StockfishOptions`.
//
// It speaks UCI like the land engine and is one, mostly: everything but `go` and its own options
// is the land engine's, and the pick is drawn from a stream of its own so a game replays from its
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

		await start();
		const { position, fen, moves } = game;
		const nodes = command.limits.nodes ?? options.nodes;
		const lines = await stockfish.lines({ fen, moves, nodes, lines: options.lines });
		const line = pickLine({ lines, temperature: options.temperature, rng });
		const move = line && fromUci({ position, uci: line.move });

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
