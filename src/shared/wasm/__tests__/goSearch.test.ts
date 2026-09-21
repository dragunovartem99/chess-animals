import { describe, expect, it } from "vitest";

import { createWasmGoSearch, loadEngine } from "..";
import type { WasmEngine } from "..";
import { compileBot } from "../../bots";
import type { BotDefinition } from "../../bots";
import { createUciEngine } from "../../engine";
import type { UciResponse } from "../../engine";
import { replay } from "../../engine/uciMoves";

const wasm = await loadEngine();

const WOLF: BotDefinition = {
	id: "wolf",
	search: { depth: 2 },
	weights: { swarm: -12, givesMate: 100000, materialQueen: 180 },
};

// Every move ties, so each `go` plays the first of its shuffle: the bestmoves are the stream,
// draw for draw.
const DONKEY: BotDefinition = { id: "donkey", search: { depth: 1 }, weights: {} };

function bestmoves(engine: ReturnType<typeof createUciEngine>, lines: string[][]): string[] {
	return lines.map((moves) => {
		engine.handle({ type: "position", moves });
		const responses: UciResponse[] = engine.handle({ type: "go", limits: {} });
		const best = responses.find((response) => response.type === "bestmove");
		return best?.type === "bestmove" ? best.move : "";
	});
}

describe("go through wasm", () => {
	it("searches a game with castling in it, as the protocol writes castling", () => {
		const engine = createUciEngine({
			config: compileBot(WOLF),
			name: "wolf",
			goSearch: createWasmGoSearch(wasm),
		});
		const moves = ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6", "e1g1"];
		const [best] = bestmoves(engine, [moves]);

		// `replay` stops at the first move the position rejects, so a legal answer is one it keeps.
		expect(replay({ moves: [...moves, best] }).moves).toHaveLength(moves.length + 1);
	});

	// Pinned to what the TS search played before it was retired: a stream carried wrong from one
	// `go` to the next changes every move after the first.
	it("carries the tie-break stream from one go to the next", () => {
		const lines = [[], ["e2e4"], ["e2e4", "c7c5"], ["e2e4", "c7c5", "g1f3"]];
		const engine = createUciEngine({
			config: compileBot(DONKEY),
			name: "donkey",
			goSearch: createWasmGoSearch(wasm),
		});

		expect(bestmoves(engine, lines)).toEqual(["g1f3", "h7h5", "e1e2", "b8c6"]);
	});
});

describe("go through wasm, at the edges", () => {
	it("reads the engine's king-takes-rook castling back as the king's own move", () => {
		const castles = {
			search: () => ({ best: "e1h1", score: 0, nodes: 1 }),
		} as unknown as WasmEngine;
		const engine = createUciEngine({
			config: compileBot(DONKEY),
			name: "donkey",
			goSearch: createWasmGoSearch(castles),
		});
		engine.handle({ type: "position", fen: "4k3/8/8/8/8/8/8/4K2R w K - 0 1", moves: [] });

		expect(engine.handle({ type: "go", limits: {} })).toContainEqual({
			type: "bestmove",
			move: "e1g1",
		});
	});

	it("reports the null move when the game is already over", () => {
		const engine = createUciEngine({
			config: compileBot(WOLF),
			name: "wolf",
			goSearch: createWasmGoSearch(wasm),
		});
		engine.handle({ type: "position", fen: "R5k1/5ppp/8/8/8/8/8/6K1 b - - 0 1", moves: [] });

		expect(engine.handle({ type: "go", limits: {} })).toEqual([
			{ type: "bestmove", move: "0000" },
		]);
	});
});
