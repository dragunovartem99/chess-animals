import { INITIAL_FEN } from "chessops/fen";

import type { BotConfig } from "../bots";
import { createRepetition, positionFromFen } from "../chess";
import { applyOption, describeOptions } from "./options";
import { createRng } from "./rng";
import type { UciCommand, UciResponse } from "./uci/types";
import { findBestMove, type Replayed, replay } from "./uciMoves";

export type UciEngineState = { config: BotConfig; name: string };

// The board and the game behind it travel together, because `position` is the one command that
// sets both and `go` is the one that needs both.
function startpos(): Replayed {
	return { position: positionFromFen(INITIAL_FEN), repetition: createRepetition() };
}

// One bot, driven by UCI commands. It holds no worker, no timers and no I/O: a command goes in,
// a list of responses comes out. That is what lets the whole protocol be tested without spawning
// anything, and what lets the same code run in a worker, on the main thread, or in a test.
export function createUciEngine({ config, name }: UciEngineState) {
	let current = config;
	let seed: number | string = config.id;
	let game = startpos();
	let rng = createRng(seed);

	return {
		handle(command: UciCommand): UciResponse[] {
			switch (command.type) {
				case "uci":
					return [
						{ type: "id", field: "name", value: name },
						{ type: "id", field: "author", value: "chess-animals" },
						...describeOptions(current),
						{ type: "uciok" },
					];
				case "isready":
					return [{ type: "readyok" }];
				case "ucinewgame":
					// Back to the seed the caller set, so a game replays move for move. The
					// scheduler gives each game its own seed; nothing here invents randomness.
					rng = createRng(seed);
					game = startpos();
					return [];
				case "setoption":
					if (command.name === "Seed" && command.value !== undefined) {
						seed = command.value;
						rng = createRng(seed);
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
					return findBestMove({ ...game, config: current, limits: command.limits, rng });
				default:
					return [];
			}
		},
	};
}
