import type { Chess } from "chessops/chess";
import { makeUci } from "chessops/util";

import { compileBot } from "../bots";
import { afterMove, positionFromFen, repetitionKey } from "../chess";
import { seedState } from "../engine";
import type { GoSearch } from "../engine";
import { createMover } from "../monsters";
import type { Stockfish } from "../monsters";
import { withMaia } from "../underwater";
import type { MaiaSession } from "../underwater";
import { createAdjudicator, DEFAULT_ADJUDICATION } from "./adjudicate";
import { gameEnd } from "./gameEnd";
import type { GameReport, GameSpec } from "./types";

// Maia in front of the land and monster mover, so an underwater animal asks the model instead.
const moverFor = ({
	goSearch,
	stockfish,
	maia,
}: {
	goSearch: GoSearch;
	stockfish?: Stockfish;
	maia?: MaiaSession;
}) => withMaia({ next: createMover({ goSearch, stockfish }), session: maia });

// Everything a game carries from ply to ply. `keys` and `moves` are the same history twice over,
// in the two forms that need it: exact FEN keys for the game-level threefold rule, and the moves
// the wasm engine replays into its own Zobrist stack.
type Table = {
	spec: GameSpec;
	move: ReturnType<typeof moverFor>;
	white: ReturnType<typeof compileBot>;
	black: ReturnType<typeof compileBot>;
	adjudicator: ReturnType<typeof createAdjudicator>;
	keys: string[];
	moves: string[];
};

// Each ply waits on the search before it, so the game recurses rather than looping.
async function play({
	table,
	position,
	ply,
	rngState,
}: {
	table: Table;
	position: Chess;
	ply: number;
	rngState: Uint32Array;
}): Promise<GameReport> {
	const { spec, keys, moves } = table;
	const ended = gameEnd({ spec, position, keys, ply, adjudicator: table.adjudicator });
	if (ended) return ended;

	const bot = position.turn === "white" ? table.white : table.black;
	const found = await table.move({
		game: { position, fen: spec.openingFen, moves },
		weights: bot.weights,
		search: bot.search,
		stockfish: bot.stockfish,
		maia: bot.maia,
		rngState,
	});
	// `gameStatus` has already ruled out mate and stalemate, so a missing move here would be a
	// bug in the policy, not a game end — fail loudly rather than record a phantom draw.
	if (!found.move) throw new Error(`no move for ${bot.id} at ply ${ply}`);

	keys.push(repetitionKey(position));
	moves.push(makeUci(found.move));
	const next = afterMove({ position, move: found.move });
	return play({ table, position: next, ply: ply + 1, rngState: found.rngState });
}

// One game, start to finish, as a pure function of its spec — same seed, same opening, same
// result, every time and on any thread. The scheduler's worker is a thin wrapper around this; the
// arena's reproducibility rests on it.
//
// `goSearch` is the search both bots play with — the wasm engine's in the arena, handed in rather
// than loaded here because loading it is async and a game is not. Both bots draw on one tie-break
// stream, which crosses each search as its state and comes back advanced.
export async function runGame({
	spec,
	goSearch,
	stockfish,
	maia,
}: {
	spec: GameSpec;
	goSearch: GoSearch;
	// Only a game with a monster in it asks for this.
	stockfish?: Stockfish;
	// Only a game with an underwater animal in it asks for this.
	maia?: MaiaSession;
}): Promise<GameReport> {
	const white = compileBot(spec.white);
	const black = compileBot(spec.black);
	// A fresh game for Stockfish: its hash is cleared, so a game does not depend on the ones played
	// on this thread before it, which the result cache rests on.
	if (white.stockfish || black.stockfish) await stockfish?.newGame();

	const table: Table = {
		spec,
		move: moverFor({ goSearch, stockfish, maia }),
		white,
		black,
		adjudicator: createAdjudicator(spec.adjudication ?? DEFAULT_ADJUDICATION),
		keys: [],
		moves: [],
	};
	const position = positionFromFen(spec.openingFen);
	return play({ table, position, ply: 0, rngState: seedState(spec.seed) });
}
