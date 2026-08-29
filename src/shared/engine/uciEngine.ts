import { INITIAL_FEN } from "chessops/fen";

import type { BotConfig } from "../bots";
import { positionFromFen } from "../chess";
import { applyOption, describeOptions } from "./options";
import { createRng } from "./rng";
import type { UciCommand, UciResponse } from "./uci/types";
import { findBestMove, replay } from "./uciMoves";

export type UciEngineState = { config: BotConfig; name: string };

// One bot, driven by UCI commands. It holds no worker, no timers and no I/O: a command goes in,
// a list of responses comes out. That is what lets the whole protocol be tested without spawning
// anything, and what lets the same code run in a worker, on the main thread, or in a test.
export function createUciEngine({ config, name }: UciEngineState) {
	let current = config;
	let seed: number | string = config.id;
	let position = positionFromFen(INITIAL_FEN);
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
					position = positionFromFen(INITIAL_FEN);
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
					position = replay(command);
					return [];
				case "go":
					return findBestMove({ position, config: current, rng });
				default:
					return [];
			}
		},
	};
}
