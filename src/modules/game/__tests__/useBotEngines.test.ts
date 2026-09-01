import { afterEach, describe, expect, it, vi } from "vitest";

import type { Animal } from "@/modules/bots/roster";
import { withSetup } from "@/shared/test-support/component";
import { createTestWorker } from "@/shared/test-support/worker";

import { useBotEngines } from "../composables/useBotEngines";

const DONKEY: Animal = {
	emoji: "🫏",
	tint: "#8b5cf6",
	definition: {
		id: "donkey",
		search: { depth: 1 },
		temperature: 0,
		weights: { middlegame: { materialPawn: 100, materialKnight: 300 } },
	},
};

const WOLF: Animal = {
	emoji: "🐺",
	tint: "#0ea5e9",
	definition: {
		id: "wolf",
		search: { depth: 1 },
		temperature: 0,
		weights: { middlegame: { materialQueen: 900, givesMate: 100000 } },
	},
};

function mount() {
	const workers: Worker[] = [];
	vi.stubGlobal("Worker", function WorkerStub() {
		const worker = createTestWorker();
		workers.push(worker);

		return worker;
	});

	return { ...withSetup(() => useBotEngines()), workers };
}

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

		const best = await result.askForMove({ animal: WOLF, moves: ["e2e4", "e7e5"] });

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

	it("reports thinking while a move is outstanding", () => {
		const { result } = mount();

		const pending = result.askForMove({ animal: DONKEY });

		expect(result.thinking.value).toBe(true);
		return pending;
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
