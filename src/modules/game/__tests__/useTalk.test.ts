import { describe, expect, it } from "vitest";

import { mountTalk } from "./talk";

// Black hangs the queen on h4 at ply 4, and White takes it.
const QUEEN = ["e2e4", "e7e5", "g1f3", "d8h4", "f3h4"];

describe("useTalk", () => {
	it("stays silent and spawns nothing until it is switched on", async () => {
		const { talk, spawn, play } = mountTalk();

		await play(["e2e4"]);

		expect(spawn).not.toHaveBeenCalled();
		expect(talk.said.value).toEqual([]);
	});

	it("greets, and names the piece it loses", async () => {
		const scores = [{ cp: 0 }, { cp: 0 }, { cp: 0 }, { cp: 0 }, { cp: 900 }, { cp: 900 }];
		const { switchOn, play, texts } = mountTalk({ scores });

		await switchOn();
		await play(QUEEN);

		expect(texts()).toEqual(["donkey greet 1", "donkey losequeen 1"]);
	});

	it("says check when it gives one, and nothing to a quiet move", async () => {
		const { switchOn, play, texts } = mountTalk({ white: "wolf", black: "human" });
		await switchOn();

		await play(["e2e4"]);
		expect(texts()).toEqual(["wolf greet 1"]);

		await play(["e2e4", "f7f6", "d1h5"]);
		expect(texts()).toEqual(["wolf greet 1", "wolf check 1"]);
	});
});

describe("useTalk, from game to game", () => {
	it("says goodbye with the result, and starts over on a new game", async () => {
		const { talk, status, calls, switchOn, play, texts } = mountTalk({ white: "wolf" });
		await switchOn();

		status.value = { over: true, result: "white", reason: "checkmate" };
		await play(["e2e4"]);
		expect(texts()).toEqual(["wolf win 2", "donkey loss 1"]);

		// The same seed again, but not the same hello twice running.
		talk.newGame();
		expect(calls.reset).toBe(2);
		expect(texts()).toEqual(["wolf greet 2", "donkey greet 2"]);
	});

	it("lets go of the observer when switched off", async () => {
		const { talk, calls, switchOn, play, unmount } = mountTalk();
		await switchOn();

		talk.enabled.value = false;
		await play([]);
		unmount();

		expect(calls.dispose).toBe(1);
	});
});
