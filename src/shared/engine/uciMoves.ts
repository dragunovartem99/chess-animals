import type { Chess } from "chessops/chess";
import { INITIAL_FEN } from "chessops/fen";

import type { BotConfig } from "../bots";
import { afterMove, positionFromFen } from "../chess";
import { chooseMove, scoreMoves } from "./policy";
import type { Rng } from "./rng";
import { fromUci, toUci } from "./uci/moves";
import type { UciResponse } from "./uci/types";

// Rebuilds the position a `position` command describes. A move the position rejects means the
// caller and the engine no longer agree about the game; stopping there leaves the engine on the
// last position both sides did agree on, rather than on a board neither of them meant.
export function replay({ fen, moves }: { fen?: string; moves: string[] }): Chess {
	let position = positionFromFen(fen ?? INITIAL_FEN);

	for (const uci of moves) {
		const move = fromUci({ position, uci });
		if (!move) return position;

		position = afterMove({ position, move });
	}

	return position;
}

// The answer to `go`: the move, and the score that went with it.
export function findBestMove({
	position,
	config,
	rng,
}: {
	position: Chess;
	config: BotConfig;
	rng: Rng;
}): UciResponse[] {
	const scored = scoreMoves({ position, weights: config.weights, search: config.search });
	const move = chooseMove({
		position,
		weights: config.weights,
		search: config.search,
		temperature: config.temperature,
		rng,
	});

	// `0000` is UCI's null move, which is what an engine says when it has nothing to play. Better
	// than silence: a caller waiting on `bestmove` would otherwise wait forever.
	if (!move) return [{ type: "bestmove", move: "0000" }];

	const best = Math.max(...scored.map((entry) => entry.score));
	const uci = toUci({ position, move });

	return [
		{
			type: "info",
			depth: config.search.depth,
			score: { kind: "cp", value: Math.round(best) },
			pv: [uci],
		},
		{ type: "bestmove", move: uci },
	];
}
