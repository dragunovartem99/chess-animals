import { compileBot } from "../bots";
import { afterMove, createRepetition, gameStatus, positionFromFen, repetitionKey } from "../chess";
import { chooseMove, createRng } from "../engine";
import { createAdjudicator, DEFAULT_ADJUDICATION, materialEdge } from "./adjudicate";
import type { GameReport, GameSpec } from "./types";

// One game, start to finish, as a pure function of its spec — same seed, same opening, same
// result, every time and on any thread. The scheduler's worker is a one-line wrapper around this;
// the arena's reproducibility rests on it.
export function runGame(spec: GameSpec): GameReport {
	const white = compileBot(spec.white);
	const black = compileBot(spec.black);
	const rng = createRng(spec.seed);
	const adjudicator = createAdjudicator(spec.adjudication ?? DEFAULT_ADJUDICATION);

	let position = positionFromFen(spec.openingFen);
	// The same history twice over, in the two forms that need it: exact FEN keys for the game-level
	// threefold rule, and hashes the search can test a node against without building a string.
	const keys: string[] = [];
	const repetition = createRepetition();
	let ply = 0;

	for (;;) {
		const status = gameStatus({ position, keys, plyLimit: spec.plyLimit, ply });
		if (status.over) return { result: status.result, reason: status.reason, plies: ply };

		const resigned = adjudicator.verdict(materialEdge(position));
		if (resigned) return { result: resigned, reason: "resigned", plies: ply };

		const bot = position.turn === "white" ? white : black;
		const move = chooseMove({
			position,
			weights: bot.weights,
			search: bot.search,
			temperature: bot.temperature,
			rng,
			repetition,
		});
		// `gameStatus` has already ruled out mate and stalemate, so a missing move here would be a
		// bug in the policy, not a game end — fail loudly rather than record a phantom draw.
		if (!move) throw new Error(`no move for ${bot.id} at ply ${ply}`);

		keys.push(repetitionKey(position));
		repetition.push(position);
		position = afterMove({ position, move });
		ply += 1;
	}
}
