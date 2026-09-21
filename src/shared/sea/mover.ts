import type { StockfishOptions } from "../bots";
import { createRng } from "../engine";
import type { GoRequest, GoResult, GoSearch } from "../engine";
import { fromUci } from "../engine/uci/moves";
import type { Stockfish } from "./stockfish";

export type Mover = (request: GoRequest & { stockfish?: StockfishOptions }) => Promise<GoResult>;

// `goSearch` for a game that may have a sea animal in it — the arena's, where a game is a loop
// over moves and not a conversation. A bot without `stockfish` is searched as ever; one with it
// rolls, from the game's own stream so the game replays from its seed, and either plays its own
// search or Stockfish's move. The roll is drawn on every move, so the stream does not depend on
// who played.
export function createMover({
	goSearch,
	stockfish,
}: {
	goSearch: GoSearch;
	// Left out for a caller that plays no sea animal, and asked for only if one turns up.
	stockfish?: Stockfish;
}): Mover {
	return async (request) => {
		const options = request.stockfish;
		if (!options) return goSearch(request);

		const rng = createRng(request.rngState);
		const own = rng.float() * 100 < options.mix;
		const rngState = rng.state();
		if (own) return goSearch({ ...request, rngState });
		if (!stockfish) throw new Error("a sea animal needs Stockfish");

		const { position, fen, moves } = request.game;
		await stockfish.init();
		const uci = await stockfish.bestMove({ fen, moves, nodes: options.nodes });
		const move = uci ? fromUci({ position, uci }) : undefined;

		return { move, score: 0, rngState };
	};
}
