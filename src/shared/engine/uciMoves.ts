import type { Chess } from "chessops/chess";
import { INITIAL_FEN } from "chessops/fen";

import type { BotConfig } from "../bots";
import { afterMove, createRepetition, positionFromFen, type Repetition } from "../chess";
import { pickMove, scoreMoves } from "./policy";
import type { Rng } from "./rng";
import type { SearchOptions } from "./search";
import { fromUci, toUci } from "./uci/moves";
import type { GoLimits, UciResponse } from "./uci/types";

export type Replayed = { position: Chess; repetition: Repetition };

// Rebuilds the position a `position` command describes, and the history behind it. A move the
// position rejects means the caller and the engine no longer agree about the game; stopping there
// leaves the engine on the last position both sides did agree on, rather than on a board neither
// of them meant.
//
// The history is collected here rather than asked for separately because this is the only place
// that has it: `position startpos moves …` is how a UCI caller tells an engine what has already
// been played, and without it the engine would repeat a line it has already repeated twice.
export function replay({ fen, moves }: { fen?: string; moves: string[] }): Replayed {
	let position = positionFromFen(fen ?? INITIAL_FEN);
	const repetition = createRepetition();

	for (const uci of moves) {
		const move = fromUci({ position, uci });
		if (!move) return { position, repetition };

		repetition.push(position);
		position = afterMove({ position, move });
	}

	return { position, repetition };
}

// What one `go` searches: the bot's own settings, with the limits on this particular `go`
// overriding them. UCI puts the per-move budget on the command and the standing configuration in
// `setoption`, and a caller that names neither gets what the bot was built with.
//
// `movetime` is parsed and deliberately not honoured: the search has no clock, and silently
// treating a millisecond budget as anything else would be worse than ignoring it.
function withLimits({
	search,
	limits,
}: {
	search: SearchOptions;
	limits: GoLimits;
}): SearchOptions {
	const depth =
		limits.depth !== undefined && limits.depth >= 1 ? Math.floor(limits.depth) : undefined;
	const nodes =
		limits.nodes !== undefined && limits.nodes > 0 ? Math.floor(limits.nodes) : undefined;

	return {
		...search,
		depth: depth ?? search.depth,
		nodeLimit: nodes ?? search.nodeLimit,
	};
}

// The answer to `go`: the move, and the score that went with it.
export function findBestMove({
	position,
	config,
	limits = {},
	rng,
	repetition,
}: {
	position: Chess;
	config: BotConfig;
	limits?: GoLimits;
	rng: Rng;
	repetition?: Repetition;
}): UciResponse[] {
	const search = withLimits({ search: config.search, limits });

	// One search, then sample from it. Scoring the moves and then asking the policy to score them
	// again would double the cost of every move the engine plays.
	const scored = scoreMoves({
		position,
		weights: config.weights,
		search,
		temperature: config.temperature,
		repetition,
	});
	const move = pickMove({ scored, temperature: config.temperature, rng });

	// `0000` is UCI's null move, which is what an engine says when it has nothing to play. Better
	// than silence: a caller waiting on `bestmove` would otherwise wait forever.
	if (!move) return [{ type: "bestmove", move: "0000" }];

	const best = Math.max(...scored.map((entry) => entry.score));
	const uci = toUci({ position, move });

	return [
		{
			type: "info",
			depth: search.depth,
			score: { kind: "cp", value: Math.round(best) },
			pv: [uci],
		},
		{ type: "bestmove", move: uci },
	];
}
