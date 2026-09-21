import type { UciTransport } from "../engine";

export type Stockfish = {
	init: () => Promise<void>;
	newGame: () => Promise<void>;
	// The move Stockfish plays after `nodes` nodes, in Chess960 notation — castling as the king
	// taking its rook, which is chessops's and this repo's own — or `undefined` once the game is
	// over.
	bestMove: (request: {
		fen: string;
		moves: readonly string[];
		nodes: number;
	}) => Promise<string | undefined>;
	dispose: () => void;
};

const BEST_MOVE = /^bestmove (\S+)/u;

// Stockfish over a `UciTransport`, asking one question at a time — the sea engine's commands are
// handled in order, so a second question never arrives while the first is out.
export function createStockfish({ transport }: { transport: UciTransport }): Stockfish {
	let listener: ((line: string) => void) | undefined;
	transport.subscribe((line) => listener?.(line));

	// The listener is set before the commands go out, for the reason `createUciClient` gives: a
	// local transport answers during `send`.
	function ask({ commands, until }: { commands: string[]; until: RegExp }): Promise<string> {
		return new Promise((resolve) => {
			listener = (line) => {
				if (!until.test(line)) return;

				listener = undefined;
				resolve(line);
			};
			for (const command of commands) transport.send(command);
		});
	}

	async function handshake(): Promise<void> {
		await ask({ commands: ["uci"], until: /^uciok/u });
		// Chess960 notation, so no castling translation is needed on the way in or out.
		const chess960 = "setoption name UCI_Chess960 value true";
		await ask({ commands: [chess960, "isready"], until: /^readyok/u });
	}

	// Once, however many callers ask: whoever needs Stockfish first starts it, and the rest wait on
	// the same handshake.
	let started: Promise<void> | undefined;

	return {
		init: () => (started ??= handshake()),
		async newGame() {
			await ask({ commands: ["ucinewgame", "isready"], until: /^readyok/u });
		},
		async bestMove({ fen, moves, nodes }) {
			const played = moves.length > 0 ? ` moves ${moves.join(" ")}` : "";
			const line = await ask({
				commands: [`position fen ${fen}${played}`, `go nodes ${nodes}`],
				until: BEST_MOVE,
			});
			const move = BEST_MOVE.exec(line)?.[1];

			return move === "(none)" || move === "0000" ? undefined : move;
		},
		dispose: transport.dispose,
	};
}
