import type { NormalMove } from "chessops/types";

import type { WeightVector } from "../eval";
import { scoreMoves } from "./policy";
import { createRng } from "./rng";
import type { SearchOptions } from "./search";
import type { Replayed } from "./uciMoves";

export type GoRequest = {
	game: Replayed;
	weights: WeightVector;
	search: SearchOptions;
	// Where the bot's tie-break stream stands. It crosses the call as these four words and comes
	// back advanced, so a search in wasm and one in TS draw the same stream the same way.
	rngState: Uint32Array;
};

export type GoResult = { move?: NormalMove; score: number; rngState: Uint32Array };

// What `go` searches with. A parameter of the UCI engine rather than a call inside it: the worker
// passes the wasm search, and a test or the in-thread transport keeps the TS one, until cutover
// deletes it.
export type GoSearch = (request: GoRequest) => GoResult;

export const searchInTs: GoSearch = ({ game, weights, search, rngState }) => {
	const rng = createRng(rngState);
	const { position, repetition } = game;
	const root = scoreMoves({ position, weights, search, rng, repetition });
	const score = Math.max(...root.scored.map((entry) => entry.score));

	return { move: root.best, score, rngState: rng.state() };
};
