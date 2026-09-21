import type { StockfishOptions } from "../bots";
import { createRng } from "../engine";
import type { GoRequest, GoResult, GoSearch } from "../engine";
import { fromUci } from "../engine/uci/moves";
import { pickLine } from "./lines";
import type { Stockfish } from "./stockfish";

export type Mover = (request: GoRequest & { stockfish?: StockfishOptions }) => Promise<GoResult>;

// `goSearch` for a game that may have a monster in it — the arena's, where a game is a loop
// over moves and not a conversation. A bot without `stockfish` is searched as ever; one with it
// asks Stockfish for its lines and picks one from the game's own stream, so the game replays from
// its seed.
export function createMover({
	goSearch,
	stockfish,
}: {
	goSearch: GoSearch;
	// Left out for a caller that plays no monster, and asked for only if one turns up.
	stockfish?: Stockfish;
}): Mover {
	return async (request) => {
		const options = request.stockfish;
		if (!options) return goSearch(request);
		if (!stockfish) throw new Error("a monster needs Stockfish");

		const { position, fen, moves } = request.game;
		await stockfish.init();
		const lines = await stockfish.lines({
			fen,
			moves,
			nodes: options.nodes,
			lines: options.lines,
		});
		const rng = createRng(request.rngState);
		const line = pickLine({ lines, temperature: options.temperature, rng });
		const move = line ? fromUci({ position, uci: line.move }) : undefined;

		return { move, score: line?.score ?? 0, rngState: rng.state() };
	};
}
