import type { UciTransport } from "../engine";
import { parseLines } from "./lines";
import type { Line } from "./lines";

export type Stockfish = {
	init: () => Promise<void>;
	newGame: () => Promise<void>;
	// Stockfish's best `lines` candidates after `nodes` nodes, best first, in Chess960 notation —
	// castling as the king taking its rook, which is chessops's and this repo's own. Empty once the
	// game is over.
	lines: (request: {
		fen: string;
		moves: readonly string[];
		nodes: number;
		lines: number;
	}) => Promise<Line[]>;
	dispose: () => void;
};

const BEST_MOVE = /^bestmove (\S+)/u;

// Stockfish over a `UciTransport`, asking one question at a time — the monster engine's commands are
// handled in order, so a second question never arrives while the first is out.
export function createStockfish({ transport }: { transport: UciTransport }): Stockfish {
	let listener: ((line: string) => void) | undefined;
	transport.subscribe((line) => listener?.(line));

	// Everything said up to and including the line that ends the question. The listener is set
	// before the commands go out, for the reason `createUciClient` gives: a local transport answers
	// during `send`.
	function ask({ commands, until }: { commands: string[]; until: RegExp }): Promise<string[]> {
		return new Promise((resolve) => {
			const said: string[] = [];
			listener = (line) => {
				said.push(line);
				if (!until.test(line)) return;

				listener = undefined;
				resolve(said);
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
		async lines({ fen, moves, nodes, lines }) {
			const played = moves.length > 0 ? ` moves ${moves.join(" ")}` : "";
			const said = await ask({
				commands: [
					`setoption name MultiPV value ${lines}`,
					`position fen ${fen}${played}`,
					`go nodes ${nodes}`,
				],
				until: BEST_MOVE,
			});
			const best = BEST_MOVE.exec(said.at(-1) ?? "")?.[1];
			if (best === undefined || best === "(none)" || best === "0000") return [];

			// A search stopped before its first line finished still names a move: play that.
			const found = parseLines(said);
			return found.length > 0 ? found : [{ move: best, score: 0 }];
		},
		dispose: transport.dispose,
	};
}
