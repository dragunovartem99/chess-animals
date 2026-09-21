import { INITIAL_FEN } from "chessops/fen";

import type { BotConfig } from "../bots";
import { positionFromFen } from "../chess";
import { createRng, createUciEngine } from "../engine";
import type { GoSearch, Rng, UciCommand, UciResponse } from "../engine";
import { toUci } from "../engine/uci/moves";
import { replay } from "../engine/uciMoves";
import type { Replayed } from "../engine/uciMoves";
import { maiaMove } from "./maia";
import type { MaiaSession } from "./maia";

export type UnderwaterEngineState = {
	config: BotConfig;
	name: string;
	session: MaiaSession;
	goSearch: GoSearch;
};

const NULL_MOVE: UciResponse[] = [{ type: "bestmove", move: "0000" }];
const startpos = (): Replayed => ({
	position: positionFromFen(INITIAL_FEN),
	fen: INITIAL_FEN,
	moves: [],
});

// One underwater animal behind UCI, the monster engine's shape with Maia in Stockfish's place:
// everything but `go` is the land engine's, and the pick is drawn from a stream of its own so a
// game replays from its seed. `isready` waits for the model, which is what the board's loading
// state waits on — the first answer costs the download.
export function createUnderwaterEngine({ config, name, session, goSearch }: UnderwaterEngineState) {
	const land = createUciEngine({ config, name, goSearch });
	let seed: number | string = config.id;
	let rng: Rng = createRng(seed);
	let game = startpos();

	async function go(): Promise<UciResponse[]> {
		const options = config.maia;
		if (!options) throw new Error(`"${config.id}" is not an underwater animal`);

		const { position } = game;
		const move = await maiaMove({ session, position, options, rng });

		return move ? [{ type: "bestmove", move: toUci({ position, move }) }] : NULL_MOVE;
	}

	return {
		async handle(command: UciCommand): Promise<UciResponse[]> {
			switch (command.type) {
				case "isready":
					await session.ready();
					return land.handle(command);
				case "ucinewgame":
					rng = createRng(seed);
					game = startpos();
					return land.handle(command);
				case "setoption":
					if (command.name === "Seed" && command.value !== undefined) {
						seed = command.value;
						rng = createRng(seed);
					}
					return land.handle(command);
				case "position":
					game = replay(command);
					return land.handle(command);
				case "go":
					return go();
				default:
					return land.handle(command);
			}
		},
	};
}
