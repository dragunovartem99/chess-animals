import type { SearchOptions } from "../engine";
import { FEATURE_COUNT, type FeatureVector, type WeightVector } from "../eval";
import { ABI_VERSION, type Arena, createArena, type Exports, type Game } from "./memory";

export type { Game };

export type SearchRequest = Game & {
	weights: WeightVector;
	options: SearchOptions;
	// The xorshift128 state to shuffle the root with, as `seedState` makes it. Left out, the root
	// is searched in generated order.
	rngState?: Uint32Array;
};

export type SearchResponse = {
	// chessops's UCI, castling as the king taking its rook; absent when the game is over.
	best?: string;
	score: number;
	nodes: number;
	// The state after the shuffle's draws, for the caller to carry on from.
	rngState?: Uint32Array;
};

export type WasmEngine = {
	search: (request: SearchRequest) => SearchResponse;
	// The position the game reaches, its last move read as the one that produced it.
	extract: (game: Game) => FeatureVector;
	perft: (request: Game & { depth: number }) => number;
};

const MAX_NODE_LIMIT = 2 ** 32 - 1;

function rejected(game: Game): Error {
	return new Error(`the engine rejected ${game.fen} with moves [${game.moves?.join(" ") ?? ""}]`);
}

function createSearch({ exports, arena }: { exports: Exports; arena: Arena }) {
	return function search({ weights, options, rngState, ...game }: SearchRequest): SearchResponse {
		if (weights.length !== FEATURE_COUNT) throw new Error("a weight vector per feature");

		arena.writeGame(game);
		arena.weights.set(weights);
		if (rngState) arena.rng.set(rngState);

		const nodeLimit = Math.min(options.nodeLimit ?? 0, MAX_NODE_LIMIT);
		const quiescence = options.quiescence ? 1 : 0;
		if (!exports.engine_search(options.depth, quiescence, nodeLimit, rngState ? 1 : 0)) {
			throw rejected(game);
		}

		const best = arena.readText();
		return {
			best: best === "" ? undefined : best,
			// `+ 0` turns negamax's -0, a draw seen from the other seat, into the 0 a caller compares.
			score: arena.result[0] + 0,
			nodes: arena.result[1],
			rngState: rngState ? arena.rng.slice() : undefined,
		};
	};
}

// One engine per module instance, which a caller keeps for its lifetime: `engine_init` builds the
// tables once, and every call after it reuses the same fixed buffers.
export async function createEngine(source: BufferSource): Promise<WasmEngine> {
	const { instance } = await WebAssembly.instantiate(source, {});
	const exports = instance.exports as unknown as Exports;
	const version = exports.abi_version();
	if (version !== ABI_VERSION) {
		throw new Error(`engine.wasm speaks abi ${version}, not ${ABI_VERSION}: rebuild it`);
	}

	exports.engine_init();
	const arena = createArena(exports);

	function extract(game: Game): FeatureVector {
		arena.writeGame(game);
		if (!exports.engine_extract()) throw rejected(game);

		return arena.features.slice();
	}

	function perft({ depth, ...game }: Game & { depth: number }): number {
		arena.writeGame(game);
		const leaves = exports.engine_perft(depth);
		if (leaves < 0) throw rejected(game);

		return leaves;
	}

	return { search: createSearch({ exports, arena }), extract, perft };
}
