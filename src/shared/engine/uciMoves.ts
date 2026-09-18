import type { Chess } from "chessops/chess";
import { INITIAL_FEN } from "chessops/fen";
import { makeUci } from "chessops/util";

import type { BotConfig } from "../bots";
import { afterMove, createRepetition, positionFromFen, type Repetition } from "../chess";
import type { GoSearch } from "./goSearch";
import type { SearchOptions } from "./search";
import { fromUci, toUci } from "./uci/moves";
import type { GoLimits, UciResponse } from "./uci/types";

// `fen` and `moves` are the game as the wasm engine replays it for itself: the moves in chessops's
// UCI, castling as the king taking its rook, and only those the position accepted.
export type Replayed = { position: Chess; repetition: Repetition; fen: string; moves: string[] };

// Rebuilds the position a `position` command describes, and the history behind it. A move the
// position rejects means the caller and the engine no longer agree about the game; stopping there
// leaves the engine on the last position both sides did agree on, rather than on a board neither
// of them meant.
//
// The history is collected here rather than asked for separately because this is the only place
// that has it: `position startpos moves …` is how a UCI caller tells an engine what has already
// been played, and without it the engine would repeat a line it has already repeated twice.
export function replay({ fen = INITIAL_FEN, moves }: { fen?: string; moves: string[] }): Replayed {
	let position = positionFromFen(fen);
	const repetition = createRepetition();
	const played: string[] = [];

	for (const uci of moves) {
		const move = fromUci({ position, uci });
		if (!move) break;

		repetition.push(position);
		played.push(makeUci(move));
		position = afterMove({ position, move });
	}

	return { position, repetition, fen, moves: played };
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

// The answer to `go`: the move, and the score that went with it. The rng state is handed back
// advanced, for the engine to keep until the next `go`.
export function findBestMove({
	game,
	config,
	limits = {},
	rngState,
	goSearch,
}: {
	game: Replayed;
	config: BotConfig;
	limits?: GoLimits;
	rngState: Uint32Array;
	goSearch: GoSearch;
}): { responses: UciResponse[]; rngState: Uint32Array } {
	const search = withLimits({ search: config.search, limits });
	const result = goSearch({ game, weights: config.weights, search, rngState });

	// `0000` is UCI's null move, which is what an engine says when it has nothing to play. Better
	// than silence: a caller waiting on `bestmove` would otherwise wait forever.
	if (!result.move) {
		return { responses: [{ type: "bestmove", move: "0000" }], rngState: result.rngState };
	}

	const uci = toUci({ position: game.position, move: result.move });
	const responses: UciResponse[] = [
		{
			type: "info",
			depth: search.depth,
			score: { kind: "cp", value: Math.round(result.score) },
			pv: [uci],
		},
		{ type: "bestmove", move: uci },
	];

	return { responses, rngState: result.rngState };
}
