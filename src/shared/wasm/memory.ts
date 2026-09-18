import { FEATURE_COUNT } from "../eval";

// Bumped with `ENGINE_ABI_VERSION` in `engine/include/api.h`, and checked against it at load.
export const ABI_VERSION = 2;

// `IO_TEXT_SIZE` in `api.h`; the ABI version is what keeps the two in step.
const TEXT_SIZE = 16384;

export type Exports = {
	memory: WebAssembly.Memory;
	abi_version: () => number;
	engine_init: () => void;
	io_text: () => number;
	io_weights: () => number;
	io_features: () => number;
	io_rng: () => number;
	io_result: () => number;
	engine_search: (
		depth: number,
		quiescence: number,
		nodeLimit: number,
		shuffle: number
	) => number;
	engine_extract: () => number;
	engine_perft: (depth: number) => number;
};

// A game as the engine takes it: where it started, and the moves since in chessops's UCI.
export type Game = { fen: string; moves?: readonly string[] };

export type Arena = {
	writeGame: (game: Game) => void;
	readText: () => string;
	weights: Float32Array;
	features: Float32Array;
	rng: Uint32Array;
	result: Float64Array;
};

// Views over the module's fixed buffers, made once: the engine never allocates, so its memory
// never grows, and a view over it can never be detached by a `memory.grow`.
export function createArena(exports: Exports): Arena {
	const { buffer } = exports.memory;
	const text = new Uint8Array(buffer, exports.io_text(), TEXT_SIZE);
	const encoder = new TextEncoder();
	const decoder = new TextDecoder();

	function writeGame({ fen, moves = [] }: Game): void {
		const { read, written } = encoder.encodeInto(`${fen}\n${moves.join(" ")}\0`, text);
		// Filling the buffer exactly leaves no room to know the NUL arrived, so that is too long too.
		if (written >= TEXT_SIZE || read === undefined) {
			throw new Error(`a game of ${moves.length} moves does not fit the engine's buffer`);
		}
	}

	function readText(): string {
		const end = text.indexOf(0);
		return decoder.decode(text.subarray(0, end));
	}

	return {
		writeGame,
		readText,
		weights: new Float32Array(buffer, exports.io_weights(), FEATURE_COUNT),
		features: new Float32Array(buffer, exports.io_features(), FEATURE_COUNT),
		rng: new Uint32Array(buffer, exports.io_rng(), 4),
		result: new Float64Array(buffer, exports.io_result(), 2),
	};
}
