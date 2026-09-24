import type { Color } from "chessops/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import { usePace } from "../composables/usePace";

afterEach(() => {
	vi.useRealTimers();
});

const pace = (players: Record<Color, string>) =>
	usePace({ players: ref(players), isBot: (id) => id !== "human", seed: () => "pace" });

describe("usePace", () => {
	it("holds a bot-vs-bot game a while before each move", async () => {
		vi.useFakeTimers();
		let moved = false;

		void pace({ white: "wolf", black: "goat" })().then(() => (moved = true));
		await vi.advanceTimersByTimeAsync(800);
		expect(moved).toBe(false);

		await vi.advanceTimersByTimeAsync(2400);
		expect(moved).toBe(true);
	});

	it("never keeps a human waiting", async () => {
		await expect(pace({ white: "human", black: "goat" })()).resolves.toBeUndefined();
	});
});
