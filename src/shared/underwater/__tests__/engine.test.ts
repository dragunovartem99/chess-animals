import { describe, expect, it } from "vitest";

import { compileBot } from "../../bots";
import type { BotDefinition } from "../../bots";
import { goSearch } from "../../test-support/wasm";
import { createUnderwaterEngine } from "../engine";
import type { MaiaSession } from "../maia";
import { MOVE_COUNT } from "../vocab";

const SHRIMP: BotDefinition = {
	id: "shrimp",
	search: { depth: 1 },
	maia: { elo: 500 },
	weights: {},
};
const GO = { type: "go", limits: {} } as const;

// A model that likes e2e4 and e1g1 on the board it sees, and counts how often it was readied.
function connect(definition: BotDefinition = SHRIMP) {
	let readied = 0;
	const session: MaiaSession = {
		ready: () => {
			readied += 1;
			return Promise.resolve();
		},
		run: () => {
			const logits = new Float32Array(MOVE_COUNT).fill(-50);
			logits[12 * 64 + 28] = 10;
			logits[4 * 64 + 6] = 20;
			return Promise.resolve(logits);
		},
	};
	const engine = createUnderwaterEngine({
		config: compileBot(definition),
		name: "Shrimp",
		session,
		goSearch,
	});

	return { engine, readied: () => readied };
}

async function played(engine: ReturnType<typeof connect>["engine"]) {
	const [answer] = await engine.handle(GO);
	return answer.type === "bestmove" ? answer.move : undefined;
}

describe("the underwater engine", () => {
	it("loads the model before it says it is ready", async () => {
		const { engine, readied } = connect();

		expect(await engine.handle({ type: "isready" })).toEqual([{ type: "readyok" }]);
		expect(readied()).toBe(1);
	});

	it("plays Maia's move from the position it was given", async () => {
		const { engine } = connect();
		engine.handle({ type: "position", moves: [] });

		expect(await played(engine)).toBe("e2e4");
	});

	it("answers Black's move on Maia's flipped board", async () => {
		const { engine } = connect();
		await engine.handle({ type: "position", moves: ["d2d4"] });

		expect(await played(engine)).toBe("e7e5");
	});

	it("names castling in standard notation, as the UCI client expects", async () => {
		const { engine } = connect();
		const fen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
		await engine.handle({ type: "position", fen, moves: [] });

		expect(await played(engine)).toBe("e1g1");
	});

	it("goes back to the seed on a new game, so a game replays", async () => {
		const { engine } = connect();
		await engine.handle({ type: "setoption", name: "Seed", value: "7" });
		const first = await played(engine);
		await engine.handle({ type: "ucinewgame" });

		expect(await played(engine)).toBe(first);
	});

	it("refuses a bot that is not an underwater animal", async () => {
		const land = { id: "wolf", search: { depth: 1 }, weights: {} };
		const { engine } = connect(land);

		await expect(engine.handle(GO)).rejects.toThrow("not an underwater animal");
	});

	it("identifies itself as the land engine does", async () => {
		const { engine } = connect();
		const said = await engine.handle({ type: "uci" });

		expect(said.at(-1)).toEqual({ type: "uciok" });
	});
});
