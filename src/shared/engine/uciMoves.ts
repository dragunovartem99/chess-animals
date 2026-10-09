import type { Chess } from "chessops/chess";
import { INITIAL_FEN } from "chessops/fen";
import { makeUci } from "chessops/util";

import type { BotConfig } from "../bots";
import { afterMove, positionFromFen } from "../chess";
import type { GoSearch, SearchOptions } from "./goSearch";
import { fromUci, toUci } from "./uci/moves";
import type { GoLimits, UciResponse } from "./uci/types";

// `fen` and `moves` are the game as the wasm engine replays it for itself: the moves in chessops's
// UCI, castling as the king taking its rook, and only those the position accepted.
export type Replayed = { position: Chess; fen: string; moves: string[] };

// Stops at the first move the position rejects, leaving the last board both sides agreed on. The
// history is collected here: `position … moves` is the only place a UCI caller gives it.
export function replay({ fen = INITIAL_FEN, moves }: { fen?: string; moves: string[] }): Replayed {
	let position = positionFromFen(fen);
	const played: string[] = [];

	for (const uci of moves) {
		const move = fromUci({ position, uci });
		if (!move) break;

		played.push(makeUci(move));
		position = afterMove({ position, move });
	}

	return { position, fen, moves: played };
}

// Per-`go` limits override the bot's settings. `movetime` is parsed but ignored: the search has no
// clock.
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
