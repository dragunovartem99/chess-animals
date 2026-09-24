import { afterEach, describe, expect, it, vi } from "vitest";

import { mountTalk } from "./talk";

afterEach(() => {
	vi.useRealTimers();
});

describe("useTalk's pause", () => {
	it("holds a bot-vs-bot game only while the panel is open", async () => {
		vi.useFakeTimers();
		const { talk, switchOn } = mountTalk({ white: "wolf" });
		let paused = false;

		const closed = talk.pause();
		await vi.advanceTimersByTimeAsync(0);
		await closed;
		await switchOn();
		void talk.pause().then(() => (paused = true));
		await vi.advanceTimersByTimeAsync(800);
		expect(paused).toBe(false);

		await vi.advanceTimersByTimeAsync(2400);
		expect(paused).toBe(true);
	});

	it("never holds a game with a human in it", async () => {
		const { talk, switchOn } = mountTalk();
		await switchOn();

		await expect(talk.pause()).resolves.toBeUndefined();
	});
});
