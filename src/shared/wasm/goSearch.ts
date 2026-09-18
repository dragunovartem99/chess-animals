import { isNormal } from "chessops/types";
import { parseUci } from "chessops/util";

import type { GoSearch } from "../engine";
import type { WasmEngine } from "./engine";

// `go` through the wasm engine. It replays the game from the FEN and the moves rather than being
// handed the chessops position, so its own Zobrist stack sees every repetition; the move comes
// back in chessops's form, which is what `toUci` turns into the protocol's.
export function createWasmGoSearch(engine: WasmEngine): GoSearch {
	return ({ game, weights, search, rngState }) => {
		const { fen, moves } = game;
		const result = engine.search({ fen, moves, weights, options: search, rngState });
		const parsed = result.best === undefined ? undefined : parseUci(result.best);

		return {
			move: parsed && isNormal(parsed) ? parsed : undefined,
			score: result.score,
			// Always present: a state went in, so an advanced one came back.
			rngState: result.rngState ?? rngState,
		};
	};
}
