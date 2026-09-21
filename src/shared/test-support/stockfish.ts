import type { Stockfish } from "../sea/stockfish";

// A Stockfish that plays what it is told, and remembers what it was asked.
export function fakeStockfish(move: string | undefined) {
	const asked: Parameters<Stockfish["bestMove"]>[0][] = [];
	const stockfish: Stockfish = {
		init: () => Promise.resolve(),
		newGame: () => Promise.resolve(),
		bestMove: (request) => {
			asked.push(request);
			return Promise.resolve(move);
		},
		dispose: () => undefined,
	};

	return { stockfish, asked };
}
