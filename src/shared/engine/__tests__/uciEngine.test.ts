import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { type BotDefinition, compileBot } from "../../bots";
import { createUciClient } from "../client";
import { createLocalTransport } from "../transports";

const WOLF: BotDefinition = {
	id: "wolf",
	search: { depth: 1 },
	temperature: 0,
	weights: { middlegame: { swarm: -12, givesMate: 100000, materialQueen: 180 } },
};

function connect(definition = WOLF) {
	return createUciClient({
		transport: createLocalTransport({ config: compileBot(definition), name: "Test Wolf" }),
	});
}

describe("the engine over UCI", () => {
	it("completes the handshake", async () => {
		await expect(connect().init()).resolves.toBeUndefined();
	});

	it("answers go with a legal move from the opening position", async () => {
		const engine = connect();
		await engine.init();
		engine.setPosition({});

		const { move } = await engine.go({ depth: 1 });

		expect(move).toMatch(/^[a-h][1-8][a-h][1-8]$/u);
	});

	it("plays from a position given as a FEN and a list of moves", async () => {
		const engine = connect();
		await engine.init();
		engine.setPosition({ fen: INITIAL_FEN, moves: ["e2e4", "e7e5"] });

		const { move } = await engine.go({ depth: 1 });

		// Black has just moved, so it must be a white move; e2 and e7 are both empty now.
		expect(move.startsWith("e2")).toBe(false);
	});

	it("reports the score alongside the move", async () => {
		// A material-only bot, so the reported number means something on its own: winning a queen
		// for nothing has to come out positive.
		const engine = connect({
			...WOLF,
			weights: { middlegame: { materialQueen: 900, materialRook: 500 } },
		});
		await engine.init();
		engine.setPosition({ fen: "4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1" });

		const { move, score } = await engine.go({ depth: 1 });

		expect(move).toBe("d1d5");
		expect(score).toBeGreaterThan(0);
	});

	it("names castling the way every other engine does", async () => {
		const engine = connect({
			...WOLF,
			weights: { middlegame: { isCastle: 1000 } },
		});
		await engine.init();
		engine.setPosition({ fen: "4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1" });

		expect((await engine.go({ depth: 1 })).move).toMatch(/^e1[gc]1$/u);
	});

	it("replays exactly after ucinewgame, from the seed it was given", async () => {
		const play = async () => {
			const engine = connect({ ...WOLF, temperature: 500 });
			await engine.init();
			engine.setOption({ name: "Seed", value: "fixed" });
			await engine.newGame();
			engine.setPosition({});

			return (await engine.go({ depth: 1 })).move;
		};

		expect(await play()).toBe(await play());
	});

	it("returns a null move rather than hanging when the game is over", async () => {
		const engine = connect();
		await engine.init();
		engine.setPosition({
			fen: "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3",
		});

		expect((await engine.go({ depth: 1 })).move).toBe("0000");
	});
});
