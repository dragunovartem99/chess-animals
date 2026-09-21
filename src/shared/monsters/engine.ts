import { INITIAL_FEN } from "chessops/fen";

import type { BotConfig } from "../bots";
import { positionFromFen } from "../chess";
import { createRng, createUciEngine } from "../engine";
import type { GoSearch, Rng, UciCommand, UciResponse } from "../engine";
import { fromUci, toUci } from "../engine/uci/moves";
import { replay } from "../engine/uciMoves";
import type { Replayed } from "../engine/uciMoves";
import { pickLine } from "./lines";
import { applyMonsterOption, describeMonsterOptions } from "./options";
import type { Stockfish } from "./stockfish";

export type MonsterEngineState = {
	config: BotConfig;
	name: string;
	stockfish: Stockfish;
	goSearch: GoSearch;
};

const NULL_MOVE: UciResponse[] = [{ type: "bestmove", move: "0000" }];

const freshGame = (): Replayed => ({
	position: positionFromFen(INITIAL_FEN),
	fen: INITIAL_FEN,
	moves: [],
});

// Stockfish's best few lines for the game so far, and one of them drawn from `rng`.
async function pickMove({
	command,
	config,
	stockfish,
	game,
	rng,
}: {
	command: Extract<UciCommand, { type: "go" }>;
	config: BotConfig;
	stockfish: Stockfish;
	game: Replayed;
	rng: Rng;
}): Promise<UciResponse[]> {
	const options = config.stockfish;
	if (!options) throw new Error(`"${config.id}" is not a monster`);

	await stockfish.init();
	const { position, fen, moves } = game;
	const nodes = command.limits.nodes ?? options.nodes;
	const lines = await stockfish.lines({ fen, moves, nodes, lines: options.lines });
	const line = pickLine({ lines, temperature: options.temperature, rng });
	const move = line && fromUci({ position, uci: line.move });

	return move ? [{ type: "bestmove", move: toUci({ position, move }) }] : NULL_MOVE;
}

// One monster: Stockfish, softened. Each move it asks Stockfish for its best few lines and
// picks one, the worse a line the less likely — see `StockfishOptions`.
//
// It speaks UCI like the land engine and is one, mostly: everything but `go` and its own options
// is the land engine's, and the pick is drawn from a stream of its own so a game replays from its
// seed. An answer is a promise, because Stockfish is a process to ask, not a function to call.
// Stockfish starts on the first command that needs it, not when the animal is made: a roster view
// that never plays one never pays for it.
export function createMonsterEngine({ config, name, stockfish, goSearch }: MonsterEngineState) {
	const land = createUciEngine({ config, name, goSearch });
	let current = config;
	let seed: number | string = config.id;
	let rng: Rng = createRng(seed);
	let game = freshGame();

	return {
		async handle(command: UciCommand): Promise<UciResponse[]> {
			switch (command.type) {
				case "uci":
					return land
						.handle(command)
						.toSpliced(-1, 0, ...describeMonsterOptions(current));
				case "isready":
					await stockfish.init();
					return land.handle(command);
				case "ucinewgame":
					rng = createRng(seed);
					game = freshGame();
					await stockfish.init();
					await stockfish.newGame();
					return land.handle(command);
				case "setoption": {
					const next = applyMonsterOption({ config: current, ...command });
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
					return pickMove({ command, config: current, stockfish, game, rng });
				default:
					return [];
			}
		},
	};
}
