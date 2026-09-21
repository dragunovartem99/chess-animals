import { describe, expect, it } from "vitest";

import { compileBot } from "../../bots";
import type { BotDefinition } from "../../bots";
import { fakeStockfish } from "../../test-support/stockfish";
import { goSearch } from "../../test-support/wasm";
import { createSeaEngine } from "../engine";

const SHARK: BotDefinition = {
	id: "shark",
	search: { depth: 2 },
	base: "material",
	stockfish: { nodes: 100, mix: 0 },
	weights: { kingDanger: -40 },
};

function connect({ move, definition = SHARK }: { move?: string; definition?: BotDefinition }) {
	const { stockfish, asked } = fakeStockfish(move);
	const engine = createSeaEngine({
		config: compileBot(definition),
		name: "Shark",
		stockfish,
		goSearch,
	});

	return { engine, asked };
}

const withMix = (mix: number): BotDefinition => ({ ...SHARK, stockfish: { nodes: 100, mix } });
const GO = { type: "go", limits: {} } as const;

// Who played a move, told by the one thing the fake does: it plays the corner pawn.
async function whoPlayed(engine: ReturnType<typeof connect>["engine"]) {
	const [answer] = await engine.handle(GO);

	return answer.type === "bestmove" && answer.move === "a2a3" ? "stockfish" : "animal";
}

describe("the sea engine", () => {
	it("completes the UCI handshake, advertising its own options too", async () => {
		const { engine } = connect({});

		const said = await engine.handle({ type: "uci" });

		expect(said.at(-1)).toEqual({ type: "uciok" });
		expect(said.filter((response) => response.type === "option")).toMatchObject([
			{ name: "Depth" },
			{ name: "Quiescence" },
			{ name: "NodeLimit" },
			{ name: "Seed" },
			{ name: "Nodes" },
			{ name: "Mix" },
		]);
		await expect(engine.handle({ type: "isready" })).resolves.toEqual([{ type: "readyok" }]);
	});

	it("asks Stockfish for the animal's budget, over the game so far", async () => {
		const { engine, asked } = connect({ move: "e7e5" });
		await engine.handle({ type: "position", moves: ["e2e4"] });

		await engine.handle(GO);

		expect(asked).toEqual([
			{ fen: expect.stringContaining("rnbqkbnr") as string, moves: ["e2e4"], nodes: 100 },
		]);
	});

	it("lets `go nodes` override the budget", async () => {
		const { engine, asked } = connect({ move: "e2e4" });

		await engine.handle({ type: "go", limits: { nodes: 7 } });

		expect(asked[0]?.nodes).toBe(7);
	});

	it("plays Stockfish's move at a mix of zero, and its own at a hundred", async () => {
		const stockfish = connect({ move: "a2a3", definition: withMix(0) });
		const animal = connect({ move: "a2a3", definition: withMix(100) });

		expect(await whoPlayed(stockfish.engine)).toBe("stockfish");
		expect(await whoPlayed(animal.engine)).toBe("animal");
		expect(animal.asked).toEqual([]);
	});

	it("plays its own moves for about the share it says, and replays from its seed", async () => {
		const play = async (seed: string) => {
			const { engine } = connect({ move: "a2a3", definition: withMix(30) });
			await engine.handle({ type: "setoption", name: "Seed", value: seed });
			const who: string[] = [];
			for (let move = 0; move < 200; move++) who.push(await whoPlayed(engine));

			return who;
		};

		const first = await play("one");
		const own = first.filter((who) => who === "animal").length;

		expect(own).toBeGreaterThan(40);
		expect(own).toBeLessThan(80);
		expect(await play("one")).toEqual(first);
		expect(await play("two")).not.toEqual(first);
	});

	it("takes the mix from `setoption`", async () => {
		const { engine } = connect({ move: "a2a3", definition: withMix(0) });
		await engine.handle({ type: "setoption", name: "Mix", value: "100" });

		expect(await whoPlayed(engine)).toBe("animal");
	});

	it("answers the null move when Stockfish has none to offer", async () => {
		const { engine } = connect({ move: undefined });

		expect(await engine.handle(GO)).toEqual([{ type: "bestmove", move: "0000" }]);
	});

	it("says castling the way UCI does, though it thinks in king-takes-rook", async () => {
		const { engine } = connect({ move: "e1h1" });
		const fen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
		await engine.handle({ type: "position", fen, moves: [] });

		expect(await engine.handle(GO)).toEqual([{ type: "bestmove", move: "e1g1" }]);
	});

	it("refuses a bot that is not a sea animal", async () => {
		const { engine } = connect({ definition: { ...SHARK, stockfish: undefined } });

		await expect(engine.handle(GO)).rejects.toThrow("not a sea animal");
	});
});
