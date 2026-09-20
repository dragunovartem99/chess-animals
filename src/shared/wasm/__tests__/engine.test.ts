import { readFile } from "node:fs/promises";

import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { createEngine, loadEngine } from "..";
import { createRng, seedState } from "../../engine";
import { FEATURE_COUNT, MATE_SCORE } from "../../eval";
import { onlyWeights } from "../../test-support/weights";

const engine = await loadEngine();

const MATERIAL = onlyWeights({
	materialPawn: 100,
	materialKnight: 300,
	materialBishop: 300,
	materialRook: 500,
	materialQueen: 900,
	givesMate: 1,
});

// A module exporting only `abi_version`, returning 999: the smallest thing a stale build could be.
const STALE = new Uint8Array([
	0x00,
	0x61,
	0x73,
	0x6d,
	0x01,
	0x00,
	0x00,
	0x00,
	0x01,
	0x05,
	0x01,
	0x60,
	0x00,
	0x01,
	0x7f,
	0x03,
	0x02,
	0x01,
	0x00,
	0x07,
	0x0f,
	0x01,
	0x0b,
	...new TextEncoder().encode("abi_version"),
	0x00,
	0x00,
	0x0a,
	0x07,
	0x01,
	0x05,
	0x00,
	0x41,
	0xe7,
	0x07,
	0x0b,
]);

describe("the wasm engine", () => {
	it("stands alone, with no libc and no JS glue to import", async () => {
		const bytes = await readFile(
			new URL("../../../../engine/build/engine.wasm", import.meta.url)
		);

		expect(WebAssembly.Module.imports(await WebAssembly.compile(bytes))).toEqual([]);
	});

	it("refuses a module built for another abi", async () => {
		await expect(createEngine(STALE)).rejects.toThrow(/abi 999/u);
	});

	it("counts perft through the boundary, after the moves it is given", () => {
		expect(engine.perft({ fen: INITIAL_FEN, depth: 3 })).toBe(8902);
		const kiwipete = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
		expect(engine.perft({ fen: kiwipete, depth: 3 })).toBe(97_862);
		expect(engine.perft({ fen: INITIAL_FEN, moves: ["e2e4", "e7e5"], depth: 1 })).toBe(29);
	});

	it("rejects a FEN that does not parse and a move that is not legal", () => {
		expect(() => engine.perft({ fen: "not a fen", depth: 1 })).toThrow(/rejected/u);
		expect(() => engine.extract({ fen: INITIAL_FEN, moves: ["e2e5"] })).toThrow(/rejected/u);
		const search = { weights: MATERIAL, options: { depth: 1 } };
		expect(() => engine.search({ fen: INITIAL_FEN, moves: ["e7e5"], ...search })).toThrow(
			/rejected/u
		);
	});

	it("rejects a game too long for its buffer and a vector of the wrong length", () => {
		const moves = Array.from({ length: 4000 }, () => "g1f3");
		expect(() => engine.extract({ fen: INITIAL_FEN, moves })).toThrow(/does not fit/u);
		const weights = new Float32Array(FEATURE_COUNT - 1);
		expect(() => engine.search({ fen: INITIAL_FEN, weights, options: { depth: 1 } })).toThrow(
			/per feature/u
		);
	});
});

describe("the wasm search", () => {
	it("finds a mate and reports it at its distance", () => {
		const fen = "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1";
		const result = engine.search({ fen, weights: MATERIAL, options: { depth: 3 } });

		expect(result).toMatchObject({ best: "a1a8", score: MATE_SCORE - 1 });
		expect(result.nodes).toBeGreaterThan(0);
	});

	// A rook down, Black's king steps back to d7, a square the game has already stood on.
	it("scores a move back into the game's history as the draw it is", () => {
		const fen = "4k3/8/8/8/8/8/8/R3K3 b - - 0 1";
		const moves = ["e8d7", "a1a2", "d7e8", "a2a1"];
		const request = { fen, weights: MATERIAL, options: { depth: 1 } };

		expect(engine.search({ ...request, moves })).toMatchObject({ best: "e8d7", score: 0 });
		expect(engine.search(request).score).toBe(-500);
	});

	it("passes quiescence and the node limit through", () => {
		const fen = "4k3/8/4p3/3p4/8/8/8/3QK3 w - - 0 1";
		const search = (quiescence: boolean) =>
			engine.search({ fen, weights: MATERIAL, options: { depth: 1, quiescence } });

		expect(search(false).score).toBe(800);
		expect(search(true).score).toBe(700);
		const options = { depth: 3, quiescence: true, nodeLimit: 50 };
		expect(engine.search({ fen, weights: MATERIAL, options }).nodes).toBeLessThanOrEqual(50);
	});

	// Every move ties, so the move is the first of the shuffle: pinned, move and stream, to what the
	// TS search played before it was retired, so the tie-break a game replays by cannot drift.
	it("shuffles the root from the state it is handed and hands it back advanced", () => {
		const CASES = [
			[INITIAL_FEN, "g2g4", 200_264],
			[
				"r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
				"c4f7",
				294_622,
			],
			[
				"r2q1rk1/pp1nbppp/2p1pn2/3p4/2PP4/2N1PN2/PPQ1BPPP/R1B2RK1 w - - 0 10",
				"c2d2",
				914_175,
			],
		] as const;

		for (const [index, [fen, best, next]] of CASES.entries()) {
			const weights = new Float32Array(FEATURE_COUNT);
			const rngState = seedState(index + 1);
			const result = engine.search({ fen, weights, options: { depth: 1 }, rngState });

			expect(result.best).toBe(best);
			expect(createRng(result.rngState!).int(1e6)).toBe(next);
		}
	});
});
