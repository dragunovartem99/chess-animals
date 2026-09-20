import { INITIAL_FEN } from "chessops/fen";

import type { BotConfig } from "../bots";
import { positionFromFen } from "../chess";
import type { GoSearch } from "./goSearch";
import { applyOption, describeOptions } from "./options";
import { seedState } from "./rng";
import type { GoLimits, UciCommand, UciResponse } from "./uci/types";
import { findBestMove, replay } from "./uciMoves";
import type { Replayed } from "./uciMoves";

export type UciEngineState = { config: BotConfig; name: string; goSearch: GoSearch };

// The board and the game behind it travel together, because `position` is the one command that
// sets both and `go` is the one that needs both.
function startpos(): Replayed {
	const position = positionFromFen(INITIAL_FEN);
	return { position, fen: INITIAL_FEN, moves: [] };
}

function identify({ config, name }: { config: BotConfig; name: string }): UciResponse[] {
	return [
		{ type: "id", field: "name", value: name },
		{ type: "id", field: "author", value: "chess-animals" },
		...describeOptions(config),
		{ type: "uciok" },
	];
}

// One bot, driven by UCI commands. It holds no worker, no timers and no I/O: a command goes in,
// a list of responses comes out. That is what lets the whole protocol be tested without spawning
// anything, and what lets the same code run in a worker, on the main thread, or in a test.
export function createUciEngine({ config, name, goSearch }: UciEngineState) {
	let current = config;
	let seed: number | string = config.id;
	let game = startpos();
	let rngState = seedState(seed);

	// The search hands the tie-break stream back advanced, and the next `go` carries on from it.
	function go(limits: GoLimits): UciResponse[] {
		const found = findBestMove({ game, config: current, limits, rngState, goSearch });
		rngState = found.rngState;
		return found.responses;
	}

	return {
		handle(command: UciCommand): UciResponse[] {
			switch (command.type) {
				case "uci":
					return identify({ config: current, name });
				case "isready":
					return [{ type: "readyok" }];
				case "ucinewgame":
					// Back to the seed the caller set, so a game replays move for move. The
					// scheduler gives each game its own seed; nothing here invents randomness.
					rngState = seedState(seed);
					game = startpos();
					return [];
				case "setoption":
					if (command.name === "Seed" && command.value !== undefined) {
						seed = command.value;
						rngState = seedState(seed);
						return [];
					}

					current = applyOption({
						config: current,
						name: command.name,
						value: command.value,
					});
					return [];
				case "position":
					game = replay(command);
					return [];
				case "go":
					return go(command.limits);
				default:
					return [];
			}
		},
	};
}
