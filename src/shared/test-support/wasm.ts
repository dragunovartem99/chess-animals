import type { Chess } from "chessops/chess";

import { fenFromPosition } from "../chess";
import { type SearchOptions, seedState } from "../engine";
import type { FeatureVector, PlayedMove, WeightVector } from "../eval";
import { createWasmGoSearch, loadEngine, playedGame } from "../wasm";

// One engine for a whole test file, loaded when the file is imported: every search and every
// feature a spec asserts on is the engine's, since there is no other.
export const engine = await loadEngine();
export const goSearch = createWasmGoSearch(engine);

// The features of a position, with the move that produced it when there was one.
export function extract({
	position,
	played,
}: {
	position: Chess;
	played?: PlayedMove;
}): FeatureVector {
	return engine.extract(playedGame({ position, played }));
}

// The move a bot plays from a position, in UCI with castling as the king taking its rook, or
// `undefined` once the game is over. `seed` shuffles the root as a game would; left out, the
// root is searched in generated order.
export function bestMove({
	position,
	weights,
	search,
	seed,
}: {
	position: Chess;
	weights: WeightVector;
	search: SearchOptions;
	seed?: number | string;
}): string | undefined {
	const rngState = seed === undefined ? undefined : seedState(seed);
	const fen = fenFromPosition(position);
	return engine.search({ fen, weights, options: search, rngState }).best;
}
