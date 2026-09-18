import type { NormalMove } from "chessops/types";

import type { WeightVector } from "../eval";
import type { Replayed } from "./uciMoves";

export type SearchOptions = {
	depth: number;
	// Extend past the last ply along captures, so the search does not stop in the middle of a
	// trade and report the half of it that suits it.
	quiescence?: boolean;
	// A ceiling on how much work one move may cost. Reaching it does not corrupt the result: the
	// search plays the best move of the last depth it finished.
	nodeLimit?: number;
};

export type GoRequest = {
	game: Replayed;
	weights: WeightVector;
	search: SearchOptions;
	// Where the bot's tie-break stream stands. It crosses the call as these four words and comes
	// back advanced, so one stream runs through a whole game however many searches it takes.
	rngState: Uint32Array;
};

export type GoResult = { move?: NormalMove; score: number; rngState: Uint32Array };

// What `go` searches with — the wasm engine's, from `createWasmGoSearch`. A parameter rather than
// a call inside the UCI engine because loading the module is async and a command is not: whoever
// owns the thread loads it once and hands it in.
export type GoSearch = (request: GoRequest) => GoResult;
