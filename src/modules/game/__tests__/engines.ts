import { vi } from "vitest";

import type { Animal } from "@/modules/bots/roster";
import { withSetup } from "@/shared/test-support/component";
import { createTestWorker } from "@/shared/test-support/worker";

import { useBotEngines } from "../composables/useBotEngines";

export const DONKEY: Animal = {
	emoji: "🫏",
	tint: "#8b5cf6",
	definition: {
		id: "donkey",
		search: { depth: 1 },
		weights: { materialPawn: 100, materialKnight: 300 },
	},
};

export const WOLF: Animal = {
	emoji: "🐺",
	tint: "#0ea5e9",
	definition: {
		id: "wolf",
		search: { depth: 1 },
		weights: { materialQueen: 900, givesMate: 100000 },
	},
};

export function mount() {
	const workers: Worker[] = [];
	vi.stubGlobal("Worker", function WorkerStub() {
		const worker = createTestWorker();
		workers.push(worker);

		return worker;
	});

	return { ...withSetup(() => useBotEngines()), workers };
}
