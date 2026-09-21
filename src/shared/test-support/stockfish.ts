import type { Line } from "../sea/lines";
import type { Stockfish } from "../sea/stockfish";

// A Stockfish that offers the lines it is told, and remembers what it was asked. A bare move is
// one line scored zero.
export function fakeStockfish(offer: string | readonly Line[] | undefined) {
	const asked: Parameters<Stockfish["lines"]>[0][] = [];
	const lines: Line[] =
		offer === undefined
			? []
			: typeof offer === "string"
				? [{ move: offer, score: 0 }]
				: [...offer];
	const stockfish: Stockfish = {
		init: () => Promise.resolve(),
		newGame: () => Promise.resolve(),
		lines: (request) => {
			asked.push(request);
			return Promise.resolve(lines);
		},
		dispose: () => undefined,
	};

	return { stockfish, asked };
}
