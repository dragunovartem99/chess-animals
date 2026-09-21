import { afterEach, describe, expect, it, vi } from "vitest";

import { DONKEY, WOLF, mount } from "./engines";

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("useBotEngines", () => {
	it("answers with a legal move from the opening position", async () => {
		const { result } = mount();

		const best = await result.askForMove({ animal: DONKEY });

		expect(best.move).toMatch(/^[a-h][1-8][a-h][1-8]$/u);
	});

	it("plays on from the moves it is given", async () => {
		const { result } = mount();

		const best = await result.askForMove({
			animal: WOLF,
			moves: ["e2e4", "e7e5"],
		});

		expect(best.move).toMatch(/^[a-h][1-8][a-h][1-8]$/u);
	});

	it("reuses one worker per animal", async () => {
		const { result, workers } = mount();

		await result.askForMove({ animal: DONKEY });
		await result.askForMove({ animal: DONKEY });

		expect(workers).toHaveLength(1);
	});

	it("gives each animal a worker of its own", async () => {
		const { result, workers } = mount();

		await result.askForMove({ animal: DONKEY });
		await result.askForMove({ animal: WOLF });

		expect(workers).toHaveLength(2);
	});

	it("is not thinking once a move comes back", async () => {
		const { result } = mount();

		await result.askForMove({ animal: DONKEY });

		expect(result.thinking.value).toBe(false);
	});

	it("resets every engine it has started for a new game", async () => {
		const { result } = mount();
		await result.askForMove({ animal: DONKEY });
		await result.askForMove({ animal: WOLF });

		await expect(result.startNewGame()).resolves.toBeUndefined();
	});

	it("has nothing to reset before the first move", async () => {
		const { result } = mount();

		await expect(result.startNewGame()).resolves.toBeUndefined();
	});

	it("terminates its workers when the view goes away", async () => {
		const { result, workers, unmount } = mount();
		await result.askForMove({ animal: DONKEY });
		const terminate = vi.spyOn(workers[0], "terminate");

		unmount();

		expect(terminate).toHaveBeenCalledOnce();
	});
});
