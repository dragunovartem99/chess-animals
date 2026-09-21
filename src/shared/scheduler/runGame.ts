import { makeUci } from "chessops/util";

import { compileBot } from "../bots";
import { afterMove, gameStatus, positionFromFen, repetitionKey } from "../chess";
import { seedState } from "../engine";
import type { GoSearch } from "../engine";
import { createMover } from "../sea";
import type { Stockfish } from "../sea";
import { createAdjudicator, DEFAULT_ADJUDICATION, materialEdge } from "./adjudicate";
import type { GameReport, GameSpec } from "./types";

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
}: {
	spec: GameSpec;
	goSearch: GoSearch;
	// Only a game with a sea animal in it asks for this.
	stockfish?: Stockfish;
}): Promise<GameReport> {
	const move = createMover({ goSearch, stockfish });
	const white = compileBot(spec.white);
	const black = compileBot(spec.black);
	let rngState = seedState(spec.seed);
	// A fresh game for Stockfish: its hash is cleared, so a game does not depend on the ones played
	// on this thread before it, which the result cache rests on.
	if (white.stockfish || black.stockfish) await stockfish?.newGame();
	const adjudicator = createAdjudicator(spec.adjudication ?? DEFAULT_ADJUDICATION);

	let position = positionFromFen(spec.openingFen);
	// The same history twice over, in the two forms that need it: exact FEN keys for the game-level
	// threefold rule, and the moves the wasm engine replays into its own Zobrist stack.
	const keys: string[] = [];
	const moves: string[] = [];
	let ply = 0;

	for (;;) {
		const status = gameStatus({ position, keys, plyLimit: spec.plyLimit, ply });
		if (status.over) return { result: status.result, reason: status.reason, plies: ply };

		const edge = materialEdge(position);
		const resigned = adjudicator.verdict(edge);
		if (resigned) return { result: resigned, reason: "resigned", plies: ply };

		// Level material and 24 half-moves with no capture or pawn move: a position both bots have
		// shuffled this long is a draw at the ply cap too. Guarded on level material so a slow but
		// real win is never thrown away — only the aimless walk to ply 120 is skipped.
		if (position.halfmoves >= 24 && Math.abs(edge) < 2) {
			return { result: null, reason: "no-progress", plies: ply };
		}

		const bot = position.turn === "white" ? white : black;
		const game = { position, fen: spec.openingFen, moves };
		const found = await move({
			game,
			weights: bot.weights,
			search: bot.search,
			stockfish: bot.stockfish,
			rngState,
		});
		rngState = found.rngState;
		// `gameStatus` has already ruled out mate and stalemate, so a missing move here would be a
		// bug in the policy, not a game end — fail loudly rather than record a phantom draw.
		if (!found.move) throw new Error(`no move for ${bot.id} at ply ${ply}`);

		keys.push(repetitionKey(position));
		moves.push(makeUci(found.move));
		position = afterMove({ position, move: found.move });
		ply += 1;
	}
}
