import { describe, expect, it } from "vitest";

import { compileBot } from "../../bots";
import type { BotDefinition } from "../../bots";
import { fakeStockfish } from "../../test-support/stockfish";
import { goSearch } from "../../test-support/wasm";
import { createMonsterEngine } from "../engine";

const SHARK: BotDefinition = {
	id: "shark",
	search: { depth: 1 },
	stockfish: { nodes: 100, lines: 3, temperature: 0 },
	weights: {},
};

const LINES = [
	{ move: "e2e4", score: 30 },
	{ move: "d2d4", score: 25 },
	{ move: "a2a3", score: -200 },
];

function connect({
	move,
	definition = SHARK,
}: {
	move?: string | typeof LINES;
	definition?: BotDefinition;
}) {
	const { stockfish, asked } = fakeStockfish(move);
	const engine = createMonsterEngine({
		config: compileBot(definition),
		name: "Shark",
		stockfish,
		goSearch,
	});

	return { engine, asked };
}

const GO = { type: "go", limits: {} } as const;

async function played(engine: ReturnType<typeof connect>["engine"]) {
	const [answer] = await engine.handle(GO);

	return answer.type === "bestmove" ? answer.move : undefined;
}

describe("the monster engine", () => {
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
			{ name: "Lines" },
			{ name: "Temperature" },
		]);
		await expect(engine.handle({ type: "isready" })).resolves.toEqual([{ type: "readyok" }]);
	});

	it("asks Stockfish for the animal's budget and lines, over the game so far", async () => {
		const { engine, asked } = connect({ move: "e7e5" });
		await engine.handle({ type: "position", moves: ["e2e4"] });

		await engine.handle(GO);

		expect(asked).toMatchObject([{ moves: ["e2e4"], nodes: 100, lines: 3 }]);
	});

	it("lets `go nodes` override the budget", async () => {
		const { engine, asked } = connect({ move: "e2e4" });

		await engine.handle({ type: "go", limits: { nodes: 7 } });

		expect(asked[0]?.nodes).toBe(7);
	});
});

describe("the monster engine's picks", () => {
	it("takes its temperature from `setoption`, and replays its picks from its seed", async () => {
		const play = async (seed: string) => {
			const { engine } = connect({ move: LINES });
			await engine.handle({ type: "setoption", name: "Temperature", value: "30" });
			await engine.handle({ type: "setoption", name: "Seed", value: seed });
			// One after another: each pick advances the stream the next is drawn from.
			return Array.from({ length: 200 }).reduce<Promise<(string | undefined)[]>>(
				async (moves) => [...(await moves), await played(engine)],
				Promise.resolve([])
			);
		};

		const first = await play("one");

		expect(first.filter((move) => move === "d2d4").length).toBeGreaterThan(50);
		expect(first).not.toContain("a2a3");
		expect(await play("one")).toEqual(first);
		expect(await play("two")).not.toEqual(first);
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

	it("refuses a bot that is not a monster", async () => {
		const { engine } = connect({ definition: { ...SHARK, stockfish: undefined } });

		await expect(engine.handle(GO)).rejects.toThrow("not a monster");
	});
});
